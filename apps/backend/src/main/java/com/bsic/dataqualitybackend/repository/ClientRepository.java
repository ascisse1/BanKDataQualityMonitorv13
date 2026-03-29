package com.bsic.dataqualitybackend.repository;

import com.bsic.dataqualitybackend.model.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClientRepository extends JpaRepository<Client, String> {

    List<Client> findByAge(String structureCode);

    List<Client> findByTcli(String clientType);

    List<Client> findByNat(String nationality);

    @Query("SELECT c FROM Client c WHERE c.age = :structureCode AND c.tcli = :clientType")
    List<Client> findByAgencyAndType(@Param("structureCode") String structureCode, @Param("clientType") String clientType);

    @Query("SELECT c FROM Client c WHERE LOWER(c.nom) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR LOWER(c.pre) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<Client> searchByName(@Param("searchTerm") String searchTerm);

    @Query("SELECT COUNT(c) FROM Client c WHERE c.age = :structureCode")
    long countByAgency(@Param("structureCode") String structureCode);

    @Query("SELECT COUNT(c) FROM Client c WHERE c.tcli = :clientType")
    long countByType(@Param("clientType") String clientType);

    long countByTcli(String tcli);
}
