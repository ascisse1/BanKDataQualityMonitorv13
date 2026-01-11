package com.bsic.dataqualitybackend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "bkcli")
@EntityListeners(AuditingEntityListener.class)
public class Client {

    @Id
    @Column(name = "cli", length = 15)
    private String cli;

    @Column(name = "nom", length = 36)
    private String nom;

    @Column(name = "tcli", length = 1)
    private String tcli;

    @Column(name = "lib", length = 2)
    private String lib;

    @Column(name = "pre", length = 30)
    private String pre;

    @Column(name = "sext", length = 1)
    private String sext;

    @Column(name = "njf", length = 36)
    private String njf;

    @Column(name = "dna")
    private LocalDate dna;

    @Column(name = "viln", length = 30)
    private String viln;

    @Column(name = "depn", length = 30)
    private String depn;

    @Column(name = "payn", length = 3)
    private String payn;

    @Column(name = "locn", length = 6)
    private String locn;

    @Column(name = "tid", length = 5)
    private String tid;

    @Column(name = "nid", length = 20)
    private String nid;

    @Column(name = "did")
    private LocalDate did;

    @Column(name = "lid", length = 30)
    private String lid;

    @Column(name = "oid", length = 30)
    private String oid;

    @Column(name = "vid")
    private LocalDate vid;

    @Column(name = "sit", length = 1)
    private String sit;

    @Column(name = "reg", length = 1)
    private String reg;

    @Column(name = "capj", length = 1)
    private String capj;

    @Column(name = "dcapj")
    private LocalDate dcapj;

    @Column(name = "sitj", length = 3)
    private String sitj;

    @Column(name = "dsitj")
    private LocalDate dsitj;

    @Column(name = "tconj", length = 1)
    private String tconj;

    @Column(name = "conj", length = 15)
    private String conj;

    @Column(name = "nbenf")
    private Short nbenf;

    @Column(name = "clifam", length = 15)
    private String clifam;

    @Column(name = "rso", length = 65)
    private String rso;

    @Column(name = "sig", length = 20)
    private String sig;

    @Column(name = "datc")
    private LocalDate datc;

    @Column(name = "fju", length = 2)
    private String fju;

    @Column(name = "nrc", length = 20)
    private String nrc;

    @Column(name = "vrc")
    private LocalDate vrc;

    @Column(name = "nchc", length = 3)
    private String nchc;

    @Column(name = "npa", length = 20)
    private String npa;

    @Column(name = "vpa")
    private LocalDate vpa;

    @Column(name = "nidn", length = 20)
    private String nidn;

    @Column(name = "nis", length = 20)
    private String nis;

    @Column(name = "nidf", length = 20)
    private String nidf;

    @Column(name = "grp", length = 6)
    private String grp;

    @Column(name = "sgrp", length = 6)
    private String sgrp;

    @Column(name = "met", length = 6)
    private String met;

    @Column(name = "smet", length = 6)
    private String smet;

    @Column(name = "cmc1", length = 36)
    private String cmc1;

    @Column(name = "cmc2", length = 36)
    private String cmc2;

    @Column(name = "age", length = 5)
    private String age;

    @Column(name = "ges", length = 3)
    private String ges;

    @Column(name = "qua", length = 2)
    private String qua;

    @Column(name = "tax", length = 1)
    private String tax;

    @Column(name = "catl", length = 1)
    private String catl;

    @Column(name = "seg", length = 3)
    private String seg;

    @Column(name = "nst", length = 20)
    private String nst;

    @Column(name = "clipar", length = 15)
    private String clipar;

    @Column(name = "chl1", length = 10)
    private String chl1;

    @Column(name = "chl2", length = 10)
    private String chl2;

    @Column(name = "chl3", length = 10)
    private String chl3;

    @Column(name = "lter", length = 1)
    private String lter;

    @Column(name = "lterc", length = 1)
    private String lterc;

    @Column(name = "resd", length = 3)
    private String resd;

    @Column(name = "catn", length = 6)
    private String catn;

    @Column(name = "sec", length = 5)
    private String sec;

    @Column(name = "lienbq", length = 3)
    private String lienbq;

    @Column(name = "aclas", length = 1)
    private String aclas;

    @Column(name = "maclas", precision = 19, scale = 4)
    private BigDecimal maclas;

    @Column(name = "emtit", length = 1)
    private String emtit;

    @Column(name = "nicr", length = 20)
    private String nicr;

    @Column(name = "ced", length = 1)
    private String ced;

    @Column(name = "clcr", length = 1)
    private String clcr;

    @Column(name = "nmer", length = 36)
    private String nmer;

    @Column(name = "lang", length = 3)
    private String lang;

    @Column(name = "nat", length = 3)
    private String nat;

    @Column(name = "res", length = 3)
    private String res;

    @Column(name = "ichq", length = 1)
    private String ichq;

    @Column(name = "dichq")
    private LocalDate dichq;

    @Column(name = "icb", length = 1)
    private String icb;

    @Column(name = "dicb")
    private LocalDate dicb;

    @Column(name = "epu", length = 1)
    private String epu;

    @Column(name = "utic", length = 10)
    private String utic;

    @Column(name = "uti", length = 10)
    private String uti;

    @Column(name = "dou")
    private LocalDate dou;

    @Column(name = "dmo")
    private LocalDate dmo;

    @Column(name = "ord", precision = 4, scale = 0)
    private BigDecimal ord;

    @Column(name = "catr", length = 1)
    private String catr;

    @Column(name = "midname", length = 30)
    private String midname;

    @Column(name = "nomrest", length = 67)
    private String nomrest;

    @Column(name = "drc")
    private LocalDate drc;

    @Column(name = "lrc", length = 30)
    private String lrc;

    @Column(name = "rso2", length = 65)
    private String rso2;

    @Column(name = "regn", length = 50)
    private String regn;

    @Column(name = "rrc", length = 1)
    private String rrc;

    @Column(name = "dvrrc")
    private LocalDate dvrrc;

    @Column(name = "uti_vrrc", length = 10)
    private String utiVrrc;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "age", referencedColumnName = "age", insertable = false, updatable = false)
    private Agency agency;
}
