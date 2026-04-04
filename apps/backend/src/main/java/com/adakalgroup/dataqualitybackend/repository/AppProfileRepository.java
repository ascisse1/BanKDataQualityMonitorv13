package com.adakalgroup.dataqualitybackend.repository;

import com.adakalgroup.dataqualitybackend.model.AppProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AppProfileRepository extends JpaRepository<AppProfile, Long> {

    Optional<AppProfile> findByCode(String code);
}
