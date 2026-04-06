package com.adakalgroup.bdqm.service;

import com.adakalgroup.bdqm.config.FatcaConfig;
import com.adakalgroup.bdqm.model.FatcaClient;
import com.adakalgroup.bdqm.model.enums.ClientType;
import com.adakalgroup.bdqm.model.enums.DeclarationType;
import com.adakalgroup.bdqm.repository.FatcaClientRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.xml.stream.XMLOutputFactory;
import javax.xml.stream.XMLStreamException;
import javax.xml.stream.XMLStreamWriter;
import java.io.StringWriter;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Service
@RequiredArgsConstructor
public class FatcaXmlGeneratorService {

    private static final String FATCA_NS = "urn:oecd:ties:fatca:v2";
    private static final String STF_NS = "urn:oecd:ties:stf:v4";
    private static final String ISO_NS = "urn:oecd:ties:isofatcatypes:v1";

    private final FatcaClientRepository fatcaClientRepository;
    private final FatcaConfig fatcaConfig;

    public record GenerationResult(String xml, int totalAccounts, String messageRefId) {}

    public GenerationResult generateXml(int reportingYear, DeclarationType type, String correctedMessageRefId) {
        log.info("Generating FATCA XML for year {} type {}", reportingYear, type);

        List<FatcaClient> reportableClients = fatcaClientRepository.findByReportingRequired(true);
        log.info("Found {} reportable clients", reportableClients.size());

        String messageRefId = generateMessageRefId(reportingYear);
        String docTypeIndic = mapDocTypeIndic(type);

        try {
            StringWriter sw = new StringWriter();
            XMLOutputFactory factory = XMLOutputFactory.newInstance();
            XMLStreamWriter w = factory.createXMLStreamWriter(sw);

            w.writeStartDocument("UTF-8", "1.0");
            w.writeStartElement("ftc", "FATCA_OECD", FATCA_NS);
            w.writeAttribute("version", "2.0");
            w.writeNamespace("ftc", FATCA_NS);
            w.writeNamespace("stf", STF_NS);
            w.writeNamespace("iso", ISO_NS);

            writeMessageSpec(w, messageRefId, reportingYear);

            // FATCA body
            w.writeStartElement(FATCA_NS, "FATCA");

            writeReportingFI(w, docTypeIndic);

            // ReportingGroup
            w.writeStartElement(FATCA_NS, "ReportingGroup");

            AtomicInteger docSeq = new AtomicInteger(1);
            for (FatcaClient client : reportableClients) {
                writeAccountReport(w, client, reportingYear, docTypeIndic, correctedMessageRefId, docSeq);
            }

            w.writeEndElement(); // ReportingGroup
            w.writeEndElement(); // FATCA
            w.writeEndElement(); // FATCA_OECD
            w.writeEndDocument();
            w.flush();
            w.close();

            String xml = sw.toString();
            log.info("Generated FATCA XML: {} accounts, messageRefId={}", reportableClients.size(), messageRefId);

            return new GenerationResult(xml, reportableClients.size(), messageRefId);

        } catch (XMLStreamException e) {
            throw new RuntimeException("Failed to generate FATCA XML", e);
        }
    }

    private void writeMessageSpec(XMLStreamWriter w, String messageRefId, int reportingYear) throws XMLStreamException {
        w.writeStartElement(FATCA_NS, "MessageSpec");

        writeElement(w, FATCA_NS, "SendingCompanyIN", fatcaConfig.getGiin());
        writeElement(w, FATCA_NS, "TransmittingCountry", fatcaConfig.getReportingCountry());
        writeElement(w, FATCA_NS, "ReceivingCountry", "US");
        writeElement(w, FATCA_NS, "MessageType", "FATCA");
        writeElement(w, FATCA_NS, "MessageRefId", messageRefId);
        writeElement(w, FATCA_NS, "ReportingPeriod", reportingYear + "-12-31");
        writeElement(w, FATCA_NS, "Timestamp", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")));

        w.writeEndElement(); // MessageSpec
    }

    private void writeReportingFI(XMLStreamWriter w, String docTypeIndic) throws XMLStreamException {
        w.writeStartElement(FATCA_NS, "ReportingFI");

        // ResCountryCode
        writeElement(w, FATCA_NS, "ResCountryCode", fatcaConfig.getReportingCountry());

        // TIN (GIIN)
        w.writeStartElement(FATCA_NS, "TIN");
        w.writeAttribute("issuedBy", fatcaConfig.getReportingCountry());
        w.writeCharacters(fatcaConfig.getGiin());
        w.writeEndElement();

        // Name
        w.writeStartElement(FATCA_NS, "Name");
        w.writeCharacters(fatcaConfig.getFiName());
        w.writeEndElement();

        // Address
        w.writeStartElement(FATCA_NS, "Address");
        writeElement(w, FATCA_NS, "AddressFree", fatcaConfig.getFiAddress());
        w.writeEndElement();

        // FilerCategory
        writeElement(w, FATCA_NS, "FilerCategory", fatcaConfig.getFilerCategory());

        // DocSpec
        writeDocSpec(w, docTypeIndic, "FI_" + fatcaConfig.getGiin(), null);

        w.writeEndElement(); // ReportingFI
    }

    private void writeAccountReport(XMLStreamWriter w, FatcaClient client, int reportingYear,
                                     String docTypeIndic, String correctedMsgRef,
                                     AtomicInteger docSeq) throws XMLStreamException {
        w.writeStartElement(FATCA_NS, "AccountReport");

        // DocSpec
        String docRefId = fatcaConfig.getGiin() + "_" + reportingYear + "_" + String.format("%06d", docSeq.getAndIncrement());
        String corrDocRefId = correctedMsgRef != null ? correctedMsgRef + "_" + client.getClientNumber() : null;
        writeDocSpec(w, docTypeIndic, docRefId, corrDocRefId);

        // AccountNumber
        w.writeStartElement(FATCA_NS, "AccountNumber");
        w.writeCharacters(client.getClientNumber());
        w.writeEndElement();

        // AccountHolder
        w.writeStartElement(FATCA_NS, "AccountHolder");

        if (client.getClientType() == ClientType.INDIVIDUAL) {
            writeIndividual(w, client);
        } else {
            writeOrganisation(w, client);
        }

        w.writeEndElement(); // AccountHolder

        // AccountBalance (placeholder — 0 if no balance data)
        w.writeStartElement(FATCA_NS, "AccountBalance");
        w.writeAttribute("currCode", "XOF");
        w.writeCharacters("0");
        w.writeEndElement();

        w.writeEndElement(); // AccountReport
    }

    private void writeIndividual(XMLStreamWriter w, FatcaClient client) throws XMLStreamException {
        w.writeStartElement(FATCA_NS, "Individual");

        // ResCountryCode
        if (client.getTaxResidenceCountry() != null) {
            writeElement(w, FATCA_NS, "ResCountryCode", client.getTaxResidenceCountry());
        }

        // TIN
        if (client.getUsTin() != null) {
            w.writeStartElement(FATCA_NS, "TIN");
            w.writeAttribute("issuedBy", "US");
            w.writeCharacters(client.getUsTin());
            w.writeEndElement();
        }

        // Name
        w.writeStartElement(FATCA_NS, "Name");
        w.writeStartElement(FATCA_NS, "NameType");
        writeElement(w, FATCA_NS, "FirstName", extractFirstName(client.getClientName()));
        writeElement(w, FATCA_NS, "LastName", extractLastName(client.getClientName()));
        w.writeEndElement(); // NameType
        w.writeEndElement(); // Name

        // Nationality
        if (client.getNationality() != null) {
            writeElement(w, FATCA_NS, "Nationality", client.getNationality());
        }

        // BirthInfo
        if (client.getBirthPlace() != null || client.getBirthCountry() != null) {
            w.writeStartElement(FATCA_NS, "BirthInfo");
            if (client.getBirthCountry() != null) {
                writeElement(w, FATCA_NS, "CountryInfo", client.getBirthCountry());
            }
            if (client.getBirthPlace() != null) {
                writeElement(w, FATCA_NS, "City", client.getBirthPlace());
            }
            w.writeEndElement(); // BirthInfo
        }

        w.writeEndElement(); // Individual
    }

    private void writeOrganisation(XMLStreamWriter w, FatcaClient client) throws XMLStreamException {
        w.writeStartElement(FATCA_NS, "Organisation");

        // ResCountryCode
        if (client.getTaxResidenceCountry() != null) {
            writeElement(w, FATCA_NS, "ResCountryCode", client.getTaxResidenceCountry());
        }

        // TIN
        if (client.getUsTin() != null) {
            w.writeStartElement(FATCA_NS, "TIN");
            w.writeAttribute("issuedBy", "US");
            w.writeCharacters(client.getUsTin());
            w.writeEndElement();
        }

        // Name
        w.writeStartElement(FATCA_NS, "Name");
        w.writeCharacters(client.getClientName() != null ? client.getClientName() : "");
        w.writeEndElement();

        w.writeEndElement(); // Organisation
    }

    private void writeDocSpec(XMLStreamWriter w, String docTypeIndic, String docRefId, String corrDocRefId) throws XMLStreamException {
        w.writeStartElement(FATCA_NS, "DocSpec");
        writeElement(w, FATCA_NS, "DocTypeIndic", docTypeIndic);
        writeElement(w, FATCA_NS, "DocRefId", docRefId);
        if (corrDocRefId != null) {
            writeElement(w, FATCA_NS, "CorrDocRefId", corrDocRefId);
        }
        w.writeEndElement();
    }

    private void writeElement(XMLStreamWriter w, String ns, String localName, String value) throws XMLStreamException {
        w.writeStartElement(ns, localName);
        w.writeCharacters(value != null ? value : "");
        w.writeEndElement();
    }

    private String mapDocTypeIndic(DeclarationType type) {
        return switch (type) {
            case ORIGINAL -> "FATCA1";
            case CORRECTED -> "FATCA2";
            case VOID -> "FATCA3";
        };
    }

    private String generateMessageRefId(int reportingYear) {
        String ts = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        return fatcaConfig.getGiin() + "_" + reportingYear + "_" + ts;
    }

    private String extractFirstName(String fullName) {
        if (fullName == null) return "";
        String[] parts = fullName.trim().split("\\s+", 2);
        return parts.length > 1 ? parts[1] : "";
    }

    private String extractLastName(String fullName) {
        if (fullName == null) return "";
        String[] parts = fullName.trim().split("\\s+", 2);
        return parts[0];
    }
}
