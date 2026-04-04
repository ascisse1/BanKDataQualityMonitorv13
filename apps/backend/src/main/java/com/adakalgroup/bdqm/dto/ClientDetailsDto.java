package com.adakalgroup.bdqm.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientDetailsDto {
    private String id;
    private String nom;
    private String pre;
    private String nid;
    private String dna;
    private String tel;
    private String email;
    private String adr;

    @JsonProperty("nom_mere")
    private String nomMere;

    private String rccm;

    @JsonProperty("raison_sociale")
    private String raisonSociale;

    @JsonProperty("forme_juridique")
    private String formeJuridique;

    @JsonProperty("num_compte")
    private String numCompte;

    private String agence;

    @JsonProperty("created_at")
    private String createdAt;
}
