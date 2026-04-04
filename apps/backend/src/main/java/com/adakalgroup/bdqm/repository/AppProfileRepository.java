package com.adakalgroup.bdqm.repository;

import com.adakalgroup.bdqm.model.AppProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AppProfileRepository extends JpaRepository<AppProfile, Long> {

    Optional<AppProfile> findByCode(String code);
}
