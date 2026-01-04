package com.bsic.dataqualitybackend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

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

    @Column(name = "nom", length = 100)
    private String nom;

    @Column(name = "tcli", length = 1)
    private String tcli;

    @Column(name = "pre", length = 100)
    private String pre;

    @Column(name = "nid", length = 30)
    private String nid;

    @Column(name = "nmer", length = 100)
    private String nmer;

    @Column(name = "dna")
    private LocalDate dna;

    @Column(name = "nat", length = 3)
    private String nat;

    @Column(name = "age", length = 5)
    private String age;

    @Column(name = "sext", length = 1)
    private String sext;

    @Column(name = "viln", length = 50)
    private String viln;

    @Column(name = "payn", length = 3)
    private String payn;

    @Column(name = "tid", length = 3)
    private String tid;

    @Column(name = "vid")
    private LocalDate vid;

    @Column(name = "nrc", length = 30)
    private String nrc;

    @Column(name = "datc")
    private LocalDate datc;

    @Column(name = "rso", length = 100)
    private String rso;

    @Column(name = "sig", length = 30)
    private String sig;

    @Column(name = "sec", length = 50)
    private String sec;

    @Column(name = "fju", length = 50)
    private String fju;

    @Column(name = "catn", length = 50)
    private String catn;

    @Column(name = "lienbq", length = 50)
    private String lienbq;

    @Column(name = "dou")
    private LocalDate dou;

    @Column(name = "clifam", length = 15)
    private String clifam;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
