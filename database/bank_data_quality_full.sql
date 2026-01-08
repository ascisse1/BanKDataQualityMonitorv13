-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: localhost    Database: bank_data_quality
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `act_ge_bytearray`
--

DROP TABLE IF EXISTS `act_ge_bytearray`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_ge_bytearray` (
  `ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `REV_` int DEFAULT NULL,
  `NAME_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `DEPLOYMENT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `BYTES_` longblob,
  `GENERATED_` tinyint DEFAULT NULL,
  `TENANT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `TYPE_` int DEFAULT NULL,
  `CREATE_TIME_` datetime DEFAULT NULL,
  `ROOT_PROC_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `REMOVAL_TIME_` datetime DEFAULT NULL,
  PRIMARY KEY (`ID_`),
  KEY `ACT_FK_BYTEARR_DEPL` (`DEPLOYMENT_ID_`),
  KEY `ACT_IDX_BYTEARRAY_ROOT_PI` (`ROOT_PROC_INST_ID_`),
  KEY `ACT_IDX_BYTEARRAY_RM_TIME` (`REMOVAL_TIME_`),
  KEY `ACT_IDX_BYTEARRAY_NAME` (`NAME_`),
  CONSTRAINT `ACT_FK_BYTEARR_DEPL` FOREIGN KEY (`DEPLOYMENT_ID_`) REFERENCES `act_re_deployment` (`ID_`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_ge_bytearray`
--

LOCK TABLES `act_ge_bytearray` WRITE;
/*!40000 ALTER TABLE `act_ge_bytearray` DISABLE KEYS */;
INSERT INTO `act_ge_bytearray` VALUES ('1bd13db5-eb6f-11f0-ac3e-7015fbb5741b',1,'C:\\Users\\Laptop-ALSACI\\Documents\\Projet Dev\\bank-data-quality-monitor-v16\\backend-java\\target\\classes\\bpmn\\ticket-workflow.bpmn','1bcde254-eb6f-11f0-ac3e-7015fbb5741b',_binary '<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<bpmn:definitions xmlns:bpmn=\"http://www.omg.org/spec/BPMN/20100524/MODEL\"\n                   xmlns:bpmndi=\"http://www.omg.org/spec/BPMN/20100524/DI\"\n                   xmlns:dc=\"http://www.omg.org/spec/DD/20100524/DC\"\n                   xmlns:di=\"http://www.omg.org/spec/DD/20100524/DI\"\n                   xmlns:camunda=\"http://camunda.org/schema/1.0/bpmn\"\n                   xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"\n                   id=\"Definitions_1\"\n                   targetNamespace=\"http://bpmn.io/schema/bpmn\">\n\n  <bpmn:process id=\"ticket-correction-process\" name=\"Ticket Correction Workflow\" isExecutable=\"true\" camunda:historyTimeToLive=\"180\">\n\n    <bpmn:startEvent id=\"StartEvent_1\" name=\"Anomaly Detected\">\n      <bpmn:outgoing>Flow_1</bpmn:outgoing>\n    </bpmn:startEvent>\n\n    <bpmn:sequenceFlow id=\"Flow_1\" sourceRef=\"StartEvent_1\" targetRef=\"Task_CreateTicket\"/>\n\n    <bpmn:serviceTask id=\"Task_CreateTicket\" name=\"Create Ticket\" camunda:delegateExpression=\"${createTicketDelegate}\">\n      <bpmn:incoming>Flow_1</bpmn:incoming>\n      <bpmn:outgoing>Flow_2</bpmn:outgoing>\n    </bpmn:serviceTask>\n\n    <bpmn:sequenceFlow id=\"Flow_2\" sourceRef=\"Task_CreateTicket\" targetRef=\"Task_AssignTicket\"/>\n\n    <bpmn:serviceTask id=\"Task_AssignTicket\" name=\"Assign to Agency User\" camunda:delegateExpression=\"${assignTicketDelegate}\">\n      <bpmn:incoming>Flow_2</bpmn:incoming>\n      <bpmn:outgoing>Flow_3</bpmn:outgoing>\n    </bpmn:serviceTask>\n\n    <bpmn:sequenceFlow id=\"Flow_3\" sourceRef=\"Task_AssignTicket\" targetRef=\"Task_AgencyCorrection\"/>\n\n    <bpmn:userTask id=\"Task_AgencyCorrection\" name=\"Agency User Corrects Data\" camunda:assignee=\"${assignedUserId}\">\n      <bpmn:incoming>Flow_3</bpmn:incoming>\n      <bpmn:incoming>Flow_Rework</bpmn:incoming>\n      <bpmn:outgoing>Flow_4</bpmn:outgoing>\n    </bpmn:userTask>\n\n    <bpmn:sequenceFlow id=\"Flow_4\" sourceRef=\"Task_AgencyCorrection\" targetRef=\"Task_RequestValidation\"/>\n\n    <bpmn:serviceTask id=\"Task_RequestValidation\" name=\"Request Validation\" camunda:delegateExpression=\"${requestValidationDelegate}\">\n      <bpmn:incoming>Flow_4</bpmn:incoming>\n      <bpmn:outgoing>Flow_5</bpmn:outgoing>\n    </bpmn:serviceTask>\n\n    <bpmn:sequenceFlow id=\"Flow_5\" sourceRef=\"Task_RequestValidation\" targetRef=\"Task_ValidateCorrection\"/>\n\n    <bpmn:userTask id=\"Task_ValidateCorrection\" name=\"Supervisor Validates (4-Eyes)\" camunda:candidateGroups=\"supervisors\">\n      <bpmn:incoming>Flow_5</bpmn:incoming>\n      <bpmn:outgoing>Flow_6</bpmn:outgoing>\n    </bpmn:userTask>\n\n    <bpmn:sequenceFlow id=\"Flow_6\" sourceRef=\"Task_ValidateCorrection\" targetRef=\"Gateway_ValidationDecision\"/>\n\n    <bpmn:exclusiveGateway id=\"Gateway_ValidationDecision\" name=\"Validation OK?\">\n      <bpmn:incoming>Flow_6</bpmn:incoming>\n      <bpmn:outgoing>Flow_Approved</bpmn:outgoing>\n      <bpmn:outgoing>Flow_Rejected</bpmn:outgoing>\n    </bpmn:exclusiveGateway>\n\n    <bpmn:sequenceFlow id=\"Flow_Approved\" name=\"Approved\" sourceRef=\"Gateway_ValidationDecision\" targetRef=\"Task_TriggerRPA\">\n      <bpmn:conditionExpression xsi:type=\"bpmn:tFormalExpression\">${validationApproved == true}</bpmn:conditionExpression>\n    </bpmn:sequenceFlow>\n\n    <bpmn:sequenceFlow id=\"Flow_Rejected\" name=\"Rejected\" sourceRef=\"Gateway_ValidationDecision\" targetRef=\"Task_NotifyRejection\">\n      <bpmn:conditionExpression xsi:type=\"bpmn:tFormalExpression\">${validationApproved == false}</bpmn:conditionExpression>\n    </bpmn:sequenceFlow>\n\n    <bpmn:serviceTask id=\"Task_NotifyRejection\" name=\"Notify Rejection\" camunda:delegateExpression=\"${notifyRejectionDelegate}\">\n      <bpmn:incoming>Flow_Rejected</bpmn:incoming>\n      <bpmn:outgoing>Flow_Rework</bpmn:outgoing>\n    </bpmn:serviceTask>\n\n    <bpmn:sequenceFlow id=\"Flow_Rework\" sourceRef=\"Task_NotifyRejection\" targetRef=\"Task_AgencyCorrection\"/>\n\n    <bpmn:serviceTask id=\"Task_TriggerRPA\" name=\"Trigger RPA (UiPath)\" camunda:delegateExpression=\"${triggerRpaDelegate}\">\n      <bpmn:incoming>Flow_Approved</bpmn:incoming>\n      <bpmn:outgoing>Flow_7</bpmn:outgoing>\n    </bpmn:serviceTask>\n\n    <bpmn:sequenceFlow id=\"Flow_7\" sourceRef=\"Task_TriggerRPA\" targetRef=\"Task_WaitRPACompletion\"/>\n\n    <bpmn:receiveTask id=\"Task_WaitRPACompletion\" name=\"Wait for RPA Completion\" messageRef=\"Message_RPACompleted\">\n      <bpmn:incoming>Flow_7</bpmn:incoming>\n      <bpmn:outgoing>Flow_8</bpmn:outgoing>\n    </bpmn:receiveTask>\n\n    <bpmn:sequenceFlow id=\"Flow_8\" sourceRef=\"Task_WaitRPACompletion\" targetRef=\"Gateway_RPASuccess\"/>\n\n    <bpmn:exclusiveGateway id=\"Gateway_RPASuccess\" name=\"RPA Success?\">\n      <bpmn:incoming>Flow_8</bpmn:incoming>\n      <bpmn:outgoing>Flow_RPASuccess</bpmn:outgoing>\n      <bpmn:outgoing>Flow_RPAFailed</bpmn:outgoing>\n    </bpmn:exclusiveGateway>\n\n    <bpmn:sequenceFlow id=\"Flow_RPASuccess\" name=\"Success\" sourceRef=\"Gateway_RPASuccess\" targetRef=\"Task_CloseTicket\">\n      <bpmn:conditionExpression xsi:type=\"bpmn:tFormalExpression\">${rpaSuccess == true}</bpmn:conditionExpression>\n    </bpmn:sequenceFlow>\n\n    <bpmn:sequenceFlow id=\"Flow_RPAFailed\" name=\"Failed\" sourceRef=\"Gateway_RPASuccess\" targetRef=\"Task_HandleRPAFailure\">\n      <bpmn:conditionExpression xsi:type=\"bpmn:tFormalExpression\">${rpaSuccess == false}</bpmn:conditionExpression>\n    </bpmn:sequenceFlow>\n\n    <bpmn:serviceTask id=\"Task_HandleRPAFailure\" name=\"Handle RPA Failure\" camunda:delegateExpression=\"${handleRpaFailureDelegate}\">\n      <bpmn:incoming>Flow_RPAFailed</bpmn:incoming>\n      <bpmn:outgoing>Flow_9</bpmn:outgoing>\n    </bpmn:serviceTask>\n\n    <bpmn:sequenceFlow id=\"Flow_9\" sourceRef=\"Task_HandleRPAFailure\" targetRef=\"EndEvent_RPAFailed\"/>\n\n    <bpmn:endEvent id=\"EndEvent_RPAFailed\" name=\"RPA Failed - Manual Intervention Required\">\n      <bpmn:incoming>Flow_9</bpmn:incoming>\n    </bpmn:endEvent>\n\n    <bpmn:serviceTask id=\"Task_CloseTicket\" name=\"Close Ticket\" camunda:delegateExpression=\"${closeTicketDelegate}\">\n      <bpmn:incoming>Flow_RPASuccess</bpmn:incoming>\n      <bpmn:outgoing>Flow_10</bpmn:outgoing>\n    </bpmn:serviceTask>\n\n    <bpmn:sequenceFlow id=\"Flow_10\" sourceRef=\"Task_CloseTicket\" targetRef=\"Task_UpdateKPIs\"/>\n\n    <bpmn:serviceTask id=\"Task_UpdateKPIs\" name=\"Update KPIs\" camunda:delegateExpression=\"${updateKpisDelegate}\">\n      <bpmn:incoming>Flow_10</bpmn:incoming>\n      <bpmn:outgoing>Flow_11</bpmn:outgoing>\n    </bpmn:serviceTask>\n\n    <bpmn:sequenceFlow id=\"Flow_11\" sourceRef=\"Task_UpdateKPIs\" targetRef=\"EndEvent_Success\"/>\n\n    <bpmn:endEvent id=\"EndEvent_Success\" name=\"Ticket Closed Successfully\">\n      <bpmn:incoming>Flow_11</bpmn:incoming>\n    </bpmn:endEvent>\n\n  </bpmn:process>\n\n  <bpmn:message id=\"Message_RPACompleted\" name=\"RPA_COMPLETED\"/>\n\n</bpmn:definitions>\n',0,NULL,1,'2026-01-07 02:18:09',NULL,NULL),('1c373f9f-eab8-11f0-8c59-7015fbb5741b',1,'C:\\Users\\Laptop-ALSACI\\Documents\\Projet Dev\\bank-data-quality-monitor-v13_new\\backend-java\\target\\classes\\bpmn\\ticket-workflow.bpmn','1c3543ce-eab8-11f0-8c59-7015fbb5741b',_binary '<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<bpmn:definitions xmlns:bpmn=\"http://www.omg.org/spec/BPMN/20100524/MODEL\"\n                   xmlns:bpmndi=\"http://www.omg.org/spec/BPMN/20100524/DI\"\n                   xmlns:dc=\"http://www.omg.org/spec/DD/20100524/DC\"\n                   xmlns:di=\"http://www.omg.org/spec/DD/20100524/DI\"\n                   xmlns:camunda=\"http://camunda.org/schema/1.0/bpmn\"\n                   xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"\n                   id=\"Definitions_1\"\n                   targetNamespace=\"http://bpmn.io/schema/bpmn\">\n\n  <bpmn:process id=\"ticket-correction-process\" name=\"Ticket Correction Workflow\" isExecutable=\"true\" camunda:historyTimeToLive=\"180\">\n\n    <bpmn:startEvent id=\"StartEvent_1\" name=\"Anomaly Detected\">\n      <bpmn:outgoing>Flow_1</bpmn:outgoing>\n    </bpmn:startEvent>\n\n    <bpmn:sequenceFlow id=\"Flow_1\" sourceRef=\"StartEvent_1\" targetRef=\"Task_CreateTicket\"/>\n\n    <bpmn:serviceTask id=\"Task_CreateTicket\" name=\"Create Ticket\" camunda:delegateExpression=\"${createTicketDelegate}\">\n      <bpmn:incoming>Flow_1</bpmn:incoming>\n      <bpmn:outgoing>Flow_2</bpmn:outgoing>\n    </bpmn:serviceTask>\n\n    <bpmn:sequenceFlow id=\"Flow_2\" sourceRef=\"Task_CreateTicket\" targetRef=\"Task_AssignTicket\"/>\n\n    <bpmn:serviceTask id=\"Task_AssignTicket\" name=\"Assign to Agency User\" camunda:delegateExpression=\"${assignTicketDelegate}\">\n      <bpmn:incoming>Flow_2</bpmn:incoming>\n      <bpmn:outgoing>Flow_3</bpmn:outgoing>\n    </bpmn:serviceTask>\n\n    <bpmn:sequenceFlow id=\"Flow_3\" sourceRef=\"Task_AssignTicket\" targetRef=\"Task_AgencyCorrection\"/>\n\n    <bpmn:userTask id=\"Task_AgencyCorrection\" name=\"Agency User Corrects Data\" camunda:assignee=\"${assignedUserId}\">\n      <bpmn:incoming>Flow_3</bpmn:incoming>\n      <bpmn:incoming>Flow_Rework</bpmn:incoming>\n      <bpmn:outgoing>Flow_4</bpmn:outgoing>\n    </bpmn:userTask>\n\n    <bpmn:sequenceFlow id=\"Flow_4\" sourceRef=\"Task_AgencyCorrection\" targetRef=\"Task_RequestValidation\"/>\n\n    <bpmn:serviceTask id=\"Task_RequestValidation\" name=\"Request Validation\" camunda:delegateExpression=\"${requestValidationDelegate}\">\n      <bpmn:incoming>Flow_4</bpmn:incoming>\n      <bpmn:outgoing>Flow_5</bpmn:outgoing>\n    </bpmn:serviceTask>\n\n    <bpmn:sequenceFlow id=\"Flow_5\" sourceRef=\"Task_RequestValidation\" targetRef=\"Task_ValidateCorrection\"/>\n\n    <bpmn:userTask id=\"Task_ValidateCorrection\" name=\"Supervisor Validates (4-Eyes)\" camunda:candidateGroups=\"supervisors\">\n      <bpmn:incoming>Flow_5</bpmn:incoming>\n      <bpmn:outgoing>Flow_6</bpmn:outgoing>\n    </bpmn:userTask>\n\n    <bpmn:sequenceFlow id=\"Flow_6\" sourceRef=\"Task_ValidateCorrection\" targetRef=\"Gateway_ValidationDecision\"/>\n\n    <bpmn:exclusiveGateway id=\"Gateway_ValidationDecision\" name=\"Validation OK?\">\n      <bpmn:incoming>Flow_6</bpmn:incoming>\n      <bpmn:outgoing>Flow_Approved</bpmn:outgoing>\n      <bpmn:outgoing>Flow_Rejected</bpmn:outgoing>\n    </bpmn:exclusiveGateway>\n\n    <bpmn:sequenceFlow id=\"Flow_Approved\" name=\"Approved\" sourceRef=\"Gateway_ValidationDecision\" targetRef=\"Task_TriggerRPA\">\n      <bpmn:conditionExpression xsi:type=\"bpmn:tFormalExpression\">${validationApproved == true}</bpmn:conditionExpression>\n    </bpmn:sequenceFlow>\n\n    <bpmn:sequenceFlow id=\"Flow_Rejected\" name=\"Rejected\" sourceRef=\"Gateway_ValidationDecision\" targetRef=\"Task_NotifyRejection\">\n      <bpmn:conditionExpression xsi:type=\"bpmn:tFormalExpression\">${validationApproved == false}</bpmn:conditionExpression>\n    </bpmn:sequenceFlow>\n\n    <bpmn:serviceTask id=\"Task_NotifyRejection\" name=\"Notify Rejection\" camunda:delegateExpression=\"${notifyRejectionDelegate}\">\n      <bpmn:incoming>Flow_Rejected</bpmn:incoming>\n      <bpmn:outgoing>Flow_Rework</bpmn:outgoing>\n    </bpmn:serviceTask>\n\n    <bpmn:sequenceFlow id=\"Flow_Rework\" sourceRef=\"Task_NotifyRejection\" targetRef=\"Task_AgencyCorrection\"/>\n\n    <bpmn:serviceTask id=\"Task_TriggerRPA\" name=\"Trigger RPA (UiPath)\" camunda:delegateExpression=\"${triggerRpaDelegate}\">\n      <bpmn:incoming>Flow_Approved</bpmn:incoming>\n      <bpmn:outgoing>Flow_7</bpmn:outgoing>\n    </bpmn:serviceTask>\n\n    <bpmn:sequenceFlow id=\"Flow_7\" sourceRef=\"Task_TriggerRPA\" targetRef=\"Task_WaitRPACompletion\"/>\n\n    <bpmn:receiveTask id=\"Task_WaitRPACompletion\" name=\"Wait for RPA Completion\" messageRef=\"Message_RPACompleted\">\n      <bpmn:incoming>Flow_7</bpmn:incoming>\n      <bpmn:outgoing>Flow_8</bpmn:outgoing>\n    </bpmn:receiveTask>\n\n    <bpmn:sequenceFlow id=\"Flow_8\" sourceRef=\"Task_WaitRPACompletion\" targetRef=\"Gateway_RPASuccess\"/>\n\n    <bpmn:exclusiveGateway id=\"Gateway_RPASuccess\" name=\"RPA Success?\">\n      <bpmn:incoming>Flow_8</bpmn:incoming>\n      <bpmn:outgoing>Flow_RPASuccess</bpmn:outgoing>\n      <bpmn:outgoing>Flow_RPAFailed</bpmn:outgoing>\n    </bpmn:exclusiveGateway>\n\n    <bpmn:sequenceFlow id=\"Flow_RPASuccess\" name=\"Success\" sourceRef=\"Gateway_RPASuccess\" targetRef=\"Task_CloseTicket\">\n      <bpmn:conditionExpression xsi:type=\"bpmn:tFormalExpression\">${rpaSuccess == true}</bpmn:conditionExpression>\n    </bpmn:sequenceFlow>\n\n    <bpmn:sequenceFlow id=\"Flow_RPAFailed\" name=\"Failed\" sourceRef=\"Gateway_RPASuccess\" targetRef=\"Task_HandleRPAFailure\">\n      <bpmn:conditionExpression xsi:type=\"bpmn:tFormalExpression\">${rpaSuccess == false}</bpmn:conditionExpression>\n    </bpmn:sequenceFlow>\n\n    <bpmn:serviceTask id=\"Task_HandleRPAFailure\" name=\"Handle RPA Failure\" camunda:delegateExpression=\"${handleRpaFailureDelegate}\">\n      <bpmn:incoming>Flow_RPAFailed</bpmn:incoming>\n      <bpmn:outgoing>Flow_9</bpmn:outgoing>\n    </bpmn:serviceTask>\n\n    <bpmn:sequenceFlow id=\"Flow_9\" sourceRef=\"Task_HandleRPAFailure\" targetRef=\"EndEvent_RPAFailed\"/>\n\n    <bpmn:endEvent id=\"EndEvent_RPAFailed\" name=\"RPA Failed - Manual Intervention Required\">\n      <bpmn:incoming>Flow_9</bpmn:incoming>\n    </bpmn:endEvent>\n\n    <bpmn:serviceTask id=\"Task_CloseTicket\" name=\"Close Ticket\" camunda:delegateExpression=\"${closeTicketDelegate}\">\n      <bpmn:incoming>Flow_RPASuccess</bpmn:incoming>\n      <bpmn:outgoing>Flow_10</bpmn:outgoing>\n    </bpmn:serviceTask>\n\n    <bpmn:sequenceFlow id=\"Flow_10\" sourceRef=\"Task_CloseTicket\" targetRef=\"Task_UpdateKPIs\"/>\n\n    <bpmn:serviceTask id=\"Task_UpdateKPIs\" name=\"Update KPIs\" camunda:delegateExpression=\"${updateKpisDelegate}\">\n      <bpmn:incoming>Flow_10</bpmn:incoming>\n      <bpmn:outgoing>Flow_11</bpmn:outgoing>\n    </bpmn:serviceTask>\n\n    <bpmn:sequenceFlow id=\"Flow_11\" sourceRef=\"Task_UpdateKPIs\" targetRef=\"EndEvent_Success\"/>\n\n    <bpmn:endEvent id=\"EndEvent_Success\" name=\"Ticket Closed Successfully\">\n      <bpmn:incoming>Flow_11</bpmn:incoming>\n    </bpmn:endEvent>\n\n  </bpmn:process>\n\n  <bpmn:message id=\"Message_RPACompleted\" name=\"RPA_COMPLETED\"/>\n\n</bpmn:definitions>\n',0,NULL,1,'2026-01-06 04:28:12',NULL,NULL),('1d4f1fc1-e9e6-11f0-b01e-7015fbb5741b',1,'C:\\Users\\Laptop-ALSACI\\Documents\\Projet Dev\\bank-data-quality-monitor-v13\\backend-java\\target\\classes\\bpmn\\ticket-workflow.bpmn','1d4e3560-e9e6-11f0-b01e-7015fbb5741b',_binary '<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<bpmn:definitions xmlns:bpmn=\"http://www.omg.org/spec/BPMN/20100524/MODEL\"\n                   xmlns:bpmndi=\"http://www.omg.org/spec/BPMN/20100524/DI\"\n                   xmlns:dc=\"http://www.omg.org/spec/DD/20100524/DC\"\n                   xmlns:di=\"http://www.omg.org/spec/DD/20100524/DI\"\n                   xmlns:camunda=\"http://camunda.org/schema/1.0/bpmn\"\n                   xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"\n                   id=\"Definitions_1\"\n                   targetNamespace=\"http://bpmn.io/schema/bpmn\">\n\n  <bpmn:process id=\"ticket-correction-process\" name=\"Ticket Correction Workflow\" isExecutable=\"true\" camunda:historyTimeToLive=\"180\">\n\n    <bpmn:startEvent id=\"StartEvent_1\" name=\"Anomaly Detected\">\n      <bpmn:outgoing>Flow_1</bpmn:outgoing>\n    </bpmn:startEvent>\n\n    <bpmn:sequenceFlow id=\"Flow_1\" sourceRef=\"StartEvent_1\" targetRef=\"Task_CreateTicket\"/>\n\n    <bpmn:serviceTask id=\"Task_CreateTicket\" name=\"Create Ticket\" camunda:delegateExpression=\"${createTicketDelegate}\">\n      <bpmn:incoming>Flow_1</bpmn:incoming>\n      <bpmn:outgoing>Flow_2</bpmn:outgoing>\n    </bpmn:serviceTask>\n\n    <bpmn:sequenceFlow id=\"Flow_2\" sourceRef=\"Task_CreateTicket\" targetRef=\"Task_AssignTicket\"/>\n\n    <bpmn:serviceTask id=\"Task_AssignTicket\" name=\"Assign to Agency User\" camunda:delegateExpression=\"${assignTicketDelegate}\">\n      <bpmn:incoming>Flow_2</bpmn:incoming>\n      <bpmn:outgoing>Flow_3</bpmn:outgoing>\n    </bpmn:serviceTask>\n\n    <bpmn:sequenceFlow id=\"Flow_3\" sourceRef=\"Task_AssignTicket\" targetRef=\"Task_AgencyCorrection\"/>\n\n    <bpmn:userTask id=\"Task_AgencyCorrection\" name=\"Agency User Corrects Data\" camunda:assignee=\"${assignedUserId}\">\n      <bpmn:incoming>Flow_3</bpmn:incoming>\n      <bpmn:incoming>Flow_Rework</bpmn:incoming>\n      <bpmn:outgoing>Flow_4</bpmn:outgoing>\n    </bpmn:userTask>\n\n    <bpmn:sequenceFlow id=\"Flow_4\" sourceRef=\"Task_AgencyCorrection\" targetRef=\"Task_RequestValidation\"/>\n\n    <bpmn:serviceTask id=\"Task_RequestValidation\" name=\"Request Validation\" camunda:delegateExpression=\"${requestValidationDelegate}\">\n      <bpmn:incoming>Flow_4</bpmn:incoming>\n      <bpmn:outgoing>Flow_5</bpmn:outgoing>\n    </bpmn:serviceTask>\n\n    <bpmn:sequenceFlow id=\"Flow_5\" sourceRef=\"Task_RequestValidation\" targetRef=\"Task_ValidateCorrection\"/>\n\n    <bpmn:userTask id=\"Task_ValidateCorrection\" name=\"Supervisor Validates (4-Eyes)\" camunda:candidateGroups=\"supervisors\">\n      <bpmn:incoming>Flow_5</bpmn:incoming>\n      <bpmn:outgoing>Flow_6</bpmn:outgoing>\n    </bpmn:userTask>\n\n    <bpmn:sequenceFlow id=\"Flow_6\" sourceRef=\"Task_ValidateCorrection\" targetRef=\"Gateway_ValidationDecision\"/>\n\n    <bpmn:exclusiveGateway id=\"Gateway_ValidationDecision\" name=\"Validation OK?\">\n      <bpmn:incoming>Flow_6</bpmn:incoming>\n      <bpmn:outgoing>Flow_Approved</bpmn:outgoing>\n      <bpmn:outgoing>Flow_Rejected</bpmn:outgoing>\n    </bpmn:exclusiveGateway>\n\n    <bpmn:sequenceFlow id=\"Flow_Approved\" name=\"Approved\" sourceRef=\"Gateway_ValidationDecision\" targetRef=\"Task_TriggerRPA\">\n      <bpmn:conditionExpression xsi:type=\"bpmn:tFormalExpression\">${validationApproved == true}</bpmn:conditionExpression>\n    </bpmn:sequenceFlow>\n\n    <bpmn:sequenceFlow id=\"Flow_Rejected\" name=\"Rejected\" sourceRef=\"Gateway_ValidationDecision\" targetRef=\"Task_NotifyRejection\">\n      <bpmn:conditionExpression xsi:type=\"bpmn:tFormalExpression\">${validationApproved == false}</bpmn:conditionExpression>\n    </bpmn:sequenceFlow>\n\n    <bpmn:serviceTask id=\"Task_NotifyRejection\" name=\"Notify Rejection\" camunda:delegateExpression=\"${notifyRejectionDelegate}\">\n      <bpmn:incoming>Flow_Rejected</bpmn:incoming>\n      <bpmn:outgoing>Flow_Rework</bpmn:outgoing>\n    </bpmn:serviceTask>\n\n    <bpmn:sequenceFlow id=\"Flow_Rework\" sourceRef=\"Task_NotifyRejection\" targetRef=\"Task_AgencyCorrection\"/>\n\n    <bpmn:serviceTask id=\"Task_TriggerRPA\" name=\"Trigger RPA (UiPath)\" camunda:delegateExpression=\"${triggerRpaDelegate}\">\n      <bpmn:incoming>Flow_Approved</bpmn:incoming>\n      <bpmn:outgoing>Flow_7</bpmn:outgoing>\n    </bpmn:serviceTask>\n\n    <bpmn:sequenceFlow id=\"Flow_7\" sourceRef=\"Task_TriggerRPA\" targetRef=\"Task_WaitRPACompletion\"/>\n\n    <bpmn:receiveTask id=\"Task_WaitRPACompletion\" name=\"Wait for RPA Completion\" messageRef=\"Message_RPACompleted\">\n      <bpmn:incoming>Flow_7</bpmn:incoming>\n      <bpmn:outgoing>Flow_8</bpmn:outgoing>\n    </bpmn:receiveTask>\n\n    <bpmn:sequenceFlow id=\"Flow_8\" sourceRef=\"Task_WaitRPACompletion\" targetRef=\"Gateway_RPASuccess\"/>\n\n    <bpmn:exclusiveGateway id=\"Gateway_RPASuccess\" name=\"RPA Success?\">\n      <bpmn:incoming>Flow_8</bpmn:incoming>\n      <bpmn:outgoing>Flow_RPASuccess</bpmn:outgoing>\n      <bpmn:outgoing>Flow_RPAFailed</bpmn:outgoing>\n    </bpmn:exclusiveGateway>\n\n    <bpmn:sequenceFlow id=\"Flow_RPASuccess\" name=\"Success\" sourceRef=\"Gateway_RPASuccess\" targetRef=\"Task_CloseTicket\">\n      <bpmn:conditionExpression xsi:type=\"bpmn:tFormalExpression\">${rpaSuccess == true}</bpmn:conditionExpression>\n    </bpmn:sequenceFlow>\n\n    <bpmn:sequenceFlow id=\"Flow_RPAFailed\" name=\"Failed\" sourceRef=\"Gateway_RPASuccess\" targetRef=\"Task_HandleRPAFailure\">\n      <bpmn:conditionExpression xsi:type=\"bpmn:tFormalExpression\">${rpaSuccess == false}</bpmn:conditionExpression>\n    </bpmn:sequenceFlow>\n\n    <bpmn:serviceTask id=\"Task_HandleRPAFailure\" name=\"Handle RPA Failure\" camunda:delegateExpression=\"${handleRpaFailureDelegate}\">\n      <bpmn:incoming>Flow_RPAFailed</bpmn:incoming>\n      <bpmn:outgoing>Flow_9</bpmn:outgoing>\n    </bpmn:serviceTask>\n\n    <bpmn:sequenceFlow id=\"Flow_9\" sourceRef=\"Task_HandleRPAFailure\" targetRef=\"EndEvent_RPAFailed\"/>\n\n    <bpmn:endEvent id=\"EndEvent_RPAFailed\" name=\"RPA Failed - Manual Intervention Required\">\n      <bpmn:incoming>Flow_9</bpmn:incoming>\n    </bpmn:endEvent>\n\n    <bpmn:serviceTask id=\"Task_CloseTicket\" name=\"Close Ticket\" camunda:delegateExpression=\"${closeTicketDelegate}\">\n      <bpmn:incoming>Flow_RPASuccess</bpmn:incoming>\n      <bpmn:outgoing>Flow_10</bpmn:outgoing>\n    </bpmn:serviceTask>\n\n    <bpmn:sequenceFlow id=\"Flow_10\" sourceRef=\"Task_CloseTicket\" targetRef=\"Task_UpdateKPIs\"/>\n\n    <bpmn:serviceTask id=\"Task_UpdateKPIs\" name=\"Update KPIs\" camunda:delegateExpression=\"${updateKpisDelegate}\">\n      <bpmn:incoming>Flow_10</bpmn:incoming>\n      <bpmn:outgoing>Flow_11</bpmn:outgoing>\n    </bpmn:serviceTask>\n\n    <bpmn:sequenceFlow id=\"Flow_11\" sourceRef=\"Task_UpdateKPIs\" targetRef=\"EndEvent_Success\"/>\n\n    <bpmn:endEvent id=\"EndEvent_Success\" name=\"Ticket Closed Successfully\">\n      <bpmn:incoming>Flow_11</bpmn:incoming>\n    </bpmn:endEvent>\n\n  </bpmn:process>\n\n  <bpmn:message id=\"Message_RPACompleted\" name=\"RPA_COMPLETED\"/>\n\n</bpmn:definitions>\n',0,NULL,1,'2026-01-05 03:24:59',NULL,NULL),('8471f5a0-ea8b-11f0-938c-7015fbb5741b',1,'C:\\Users\\Laptop-ALSACI\\Documents\\Projet Dev\\bank-data-quality-monitor-v13_bis\\backend-java\\target\\classes\\bpmn\\ticket-workflow.bpmn','8471324f-ea8b-11f0-938c-7015fbb5741b',_binary '<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<bpmn:definitions xmlns:bpmn=\"http://www.omg.org/spec/BPMN/20100524/MODEL\"\n                   xmlns:bpmndi=\"http://www.omg.org/spec/BPMN/20100524/DI\"\n                   xmlns:dc=\"http://www.omg.org/spec/DD/20100524/DC\"\n                   xmlns:di=\"http://www.omg.org/spec/DD/20100524/DI\"\n                   xmlns:camunda=\"http://camunda.org/schema/1.0/bpmn\"\n                   xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"\n                   id=\"Definitions_1\"\n                   targetNamespace=\"http://bpmn.io/schema/bpmn\">\n\n  <bpmn:process id=\"ticket-correction-process\" name=\"Ticket Correction Workflow\" isExecutable=\"true\" camunda:historyTimeToLive=\"180\">\n\n    <bpmn:startEvent id=\"StartEvent_1\" name=\"Anomaly Detected\">\n      <bpmn:outgoing>Flow_1</bpmn:outgoing>\n    </bpmn:startEvent>\n\n    <bpmn:sequenceFlow id=\"Flow_1\" sourceRef=\"StartEvent_1\" targetRef=\"Task_CreateTicket\"/>\n\n    <bpmn:serviceTask id=\"Task_CreateTicket\" name=\"Create Ticket\" camunda:delegateExpression=\"${createTicketDelegate}\">\n      <bpmn:incoming>Flow_1</bpmn:incoming>\n      <bpmn:outgoing>Flow_2</bpmn:outgoing>\n    </bpmn:serviceTask>\n\n    <bpmn:sequenceFlow id=\"Flow_2\" sourceRef=\"Task_CreateTicket\" targetRef=\"Task_AssignTicket\"/>\n\n    <bpmn:serviceTask id=\"Task_AssignTicket\" name=\"Assign to Agency User\" camunda:delegateExpression=\"${assignTicketDelegate}\">\n      <bpmn:incoming>Flow_2</bpmn:incoming>\n      <bpmn:outgoing>Flow_3</bpmn:outgoing>\n    </bpmn:serviceTask>\n\n    <bpmn:sequenceFlow id=\"Flow_3\" sourceRef=\"Task_AssignTicket\" targetRef=\"Task_AgencyCorrection\"/>\n\n    <bpmn:userTask id=\"Task_AgencyCorrection\" name=\"Agency User Corrects Data\" camunda:assignee=\"${assignedUserId}\">\n      <bpmn:incoming>Flow_3</bpmn:incoming>\n      <bpmn:incoming>Flow_Rework</bpmn:incoming>\n      <bpmn:outgoing>Flow_4</bpmn:outgoing>\n    </bpmn:userTask>\n\n    <bpmn:sequenceFlow id=\"Flow_4\" sourceRef=\"Task_AgencyCorrection\" targetRef=\"Task_RequestValidation\"/>\n\n    <bpmn:serviceTask id=\"Task_RequestValidation\" name=\"Request Validation\" camunda:delegateExpression=\"${requestValidationDelegate}\">\n      <bpmn:incoming>Flow_4</bpmn:incoming>\n      <bpmn:outgoing>Flow_5</bpmn:outgoing>\n    </bpmn:serviceTask>\n\n    <bpmn:sequenceFlow id=\"Flow_5\" sourceRef=\"Task_RequestValidation\" targetRef=\"Task_ValidateCorrection\"/>\n\n    <bpmn:userTask id=\"Task_ValidateCorrection\" name=\"Supervisor Validates (4-Eyes)\" camunda:candidateGroups=\"supervisors\">\n      <bpmn:incoming>Flow_5</bpmn:incoming>\n      <bpmn:outgoing>Flow_6</bpmn:outgoing>\n    </bpmn:userTask>\n\n    <bpmn:sequenceFlow id=\"Flow_6\" sourceRef=\"Task_ValidateCorrection\" targetRef=\"Gateway_ValidationDecision\"/>\n\n    <bpmn:exclusiveGateway id=\"Gateway_ValidationDecision\" name=\"Validation OK?\">\n      <bpmn:incoming>Flow_6</bpmn:incoming>\n      <bpmn:outgoing>Flow_Approved</bpmn:outgoing>\n      <bpmn:outgoing>Flow_Rejected</bpmn:outgoing>\n    </bpmn:exclusiveGateway>\n\n    <bpmn:sequenceFlow id=\"Flow_Approved\" name=\"Approved\" sourceRef=\"Gateway_ValidationDecision\" targetRef=\"Task_TriggerRPA\">\n      <bpmn:conditionExpression xsi:type=\"bpmn:tFormalExpression\">${validationApproved == true}</bpmn:conditionExpression>\n    </bpmn:sequenceFlow>\n\n    <bpmn:sequenceFlow id=\"Flow_Rejected\" name=\"Rejected\" sourceRef=\"Gateway_ValidationDecision\" targetRef=\"Task_NotifyRejection\">\n      <bpmn:conditionExpression xsi:type=\"bpmn:tFormalExpression\">${validationApproved == false}</bpmn:conditionExpression>\n    </bpmn:sequenceFlow>\n\n    <bpmn:serviceTask id=\"Task_NotifyRejection\" name=\"Notify Rejection\" camunda:delegateExpression=\"${notifyRejectionDelegate}\">\n      <bpmn:incoming>Flow_Rejected</bpmn:incoming>\n      <bpmn:outgoing>Flow_Rework</bpmn:outgoing>\n    </bpmn:serviceTask>\n\n    <bpmn:sequenceFlow id=\"Flow_Rework\" sourceRef=\"Task_NotifyRejection\" targetRef=\"Task_AgencyCorrection\"/>\n\n    <bpmn:serviceTask id=\"Task_TriggerRPA\" name=\"Trigger RPA (UiPath)\" camunda:delegateExpression=\"${triggerRpaDelegate}\">\n      <bpmn:incoming>Flow_Approved</bpmn:incoming>\n      <bpmn:outgoing>Flow_7</bpmn:outgoing>\n    </bpmn:serviceTask>\n\n    <bpmn:sequenceFlow id=\"Flow_7\" sourceRef=\"Task_TriggerRPA\" targetRef=\"Task_WaitRPACompletion\"/>\n\n    <bpmn:receiveTask id=\"Task_WaitRPACompletion\" name=\"Wait for RPA Completion\" messageRef=\"Message_RPACompleted\">\n      <bpmn:incoming>Flow_7</bpmn:incoming>\n      <bpmn:outgoing>Flow_8</bpmn:outgoing>\n    </bpmn:receiveTask>\n\n    <bpmn:sequenceFlow id=\"Flow_8\" sourceRef=\"Task_WaitRPACompletion\" targetRef=\"Gateway_RPASuccess\"/>\n\n    <bpmn:exclusiveGateway id=\"Gateway_RPASuccess\" name=\"RPA Success?\">\n      <bpmn:incoming>Flow_8</bpmn:incoming>\n      <bpmn:outgoing>Flow_RPASuccess</bpmn:outgoing>\n      <bpmn:outgoing>Flow_RPAFailed</bpmn:outgoing>\n    </bpmn:exclusiveGateway>\n\n    <bpmn:sequenceFlow id=\"Flow_RPASuccess\" name=\"Success\" sourceRef=\"Gateway_RPASuccess\" targetRef=\"Task_CloseTicket\">\n      <bpmn:conditionExpression xsi:type=\"bpmn:tFormalExpression\">${rpaSuccess == true}</bpmn:conditionExpression>\n    </bpmn:sequenceFlow>\n\n    <bpmn:sequenceFlow id=\"Flow_RPAFailed\" name=\"Failed\" sourceRef=\"Gateway_RPASuccess\" targetRef=\"Task_HandleRPAFailure\">\n      <bpmn:conditionExpression xsi:type=\"bpmn:tFormalExpression\">${rpaSuccess == false}</bpmn:conditionExpression>\n    </bpmn:sequenceFlow>\n\n    <bpmn:serviceTask id=\"Task_HandleRPAFailure\" name=\"Handle RPA Failure\" camunda:delegateExpression=\"${handleRpaFailureDelegate}\">\n      <bpmn:incoming>Flow_RPAFailed</bpmn:incoming>\n      <bpmn:outgoing>Flow_9</bpmn:outgoing>\n    </bpmn:serviceTask>\n\n    <bpmn:sequenceFlow id=\"Flow_9\" sourceRef=\"Task_HandleRPAFailure\" targetRef=\"EndEvent_RPAFailed\"/>\n\n    <bpmn:endEvent id=\"EndEvent_RPAFailed\" name=\"RPA Failed - Manual Intervention Required\">\n      <bpmn:incoming>Flow_9</bpmn:incoming>\n    </bpmn:endEvent>\n\n    <bpmn:serviceTask id=\"Task_CloseTicket\" name=\"Close Ticket\" camunda:delegateExpression=\"${closeTicketDelegate}\">\n      <bpmn:incoming>Flow_RPASuccess</bpmn:incoming>\n      <bpmn:outgoing>Flow_10</bpmn:outgoing>\n    </bpmn:serviceTask>\n\n    <bpmn:sequenceFlow id=\"Flow_10\" sourceRef=\"Task_CloseTicket\" targetRef=\"Task_UpdateKPIs\"/>\n\n    <bpmn:serviceTask id=\"Task_UpdateKPIs\" name=\"Update KPIs\" camunda:delegateExpression=\"${updateKpisDelegate}\">\n      <bpmn:incoming>Flow_10</bpmn:incoming>\n      <bpmn:outgoing>Flow_11</bpmn:outgoing>\n    </bpmn:serviceTask>\n\n    <bpmn:sequenceFlow id=\"Flow_11\" sourceRef=\"Task_UpdateKPIs\" targetRef=\"EndEvent_Success\"/>\n\n    <bpmn:endEvent id=\"EndEvent_Success\" name=\"Ticket Closed Successfully\">\n      <bpmn:incoming>Flow_11</bpmn:incoming>\n    </bpmn:endEvent>\n\n  </bpmn:process>\n\n  <bpmn:message id=\"Message_RPACompleted\" name=\"RPA_COMPLETED\"/>\n\n</bpmn:definitions>\n',0,NULL,1,'2026-01-05 23:08:59',NULL,NULL);
/*!40000 ALTER TABLE `act_ge_bytearray` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_ge_property`
--

DROP TABLE IF EXISTS `act_ge_property`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_ge_property` (
  `NAME_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `VALUE_` varchar(300) COLLATE utf8mb3_bin DEFAULT NULL,
  `REV_` int DEFAULT NULL,
  PRIMARY KEY (`NAME_`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_ge_property`
--

LOCK TABLES `act_ge_property` WRITE;
/*!40000 ALTER TABLE `act_ge_property` DISABLE KEYS */;
INSERT INTO `act_ge_property` VALUES ('camunda.installation.id','26e51647-4578-48c4-8b99-2e2826dd408d',1),('camunda.telemetry.enabled','false',2),('deployment.lock','0',1),('history.cleanup.job.lock','0',1),('historyLevel','3',1),('installationId.lock','0',1),('next.dbid','1',1),('schema.history','create(fox)',1),('schema.version','fox',1),('startup.lock','0',1),('telemetry.lock','0',1);
/*!40000 ALTER TABLE `act_ge_property` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_ge_schema_log`
--

DROP TABLE IF EXISTS `act_ge_schema_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_ge_schema_log` (
  `ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `TIMESTAMP_` datetime DEFAULT NULL,
  `VERSION_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  PRIMARY KEY (`ID_`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_ge_schema_log`
--

LOCK TABLES `act_ge_schema_log` WRITE;
/*!40000 ALTER TABLE `act_ge_schema_log` DISABLE KEYS */;
INSERT INTO `act_ge_schema_log` VALUES ('0','2026-01-05 03:04:32','7.20.0');
/*!40000 ALTER TABLE `act_ge_schema_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_hi_actinst`
--

DROP TABLE IF EXISTS `act_hi_actinst`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_hi_actinst` (
  `ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `PARENT_ACT_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `PROC_DEF_KEY_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `PROC_DEF_ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `ROOT_PROC_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `PROC_INST_ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `EXECUTION_ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `ACT_ID_` varchar(255) COLLATE utf8mb3_bin NOT NULL,
  `TASK_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `CALL_PROC_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `CALL_CASE_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `ACT_NAME_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `ACT_TYPE_` varchar(255) COLLATE utf8mb3_bin NOT NULL,
  `ASSIGNEE_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `START_TIME_` datetime NOT NULL,
  `END_TIME_` datetime DEFAULT NULL,
  `DURATION_` bigint DEFAULT NULL,
  `ACT_INST_STATE_` int DEFAULT NULL,
  `SEQUENCE_COUNTER_` bigint DEFAULT NULL,
  `TENANT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `REMOVAL_TIME_` datetime DEFAULT NULL,
  PRIMARY KEY (`ID_`),
  KEY `ACT_IDX_HI_ACTINST_ROOT_PI` (`ROOT_PROC_INST_ID_`),
  KEY `ACT_IDX_HI_ACT_INST_START_END` (`START_TIME_`,`END_TIME_`),
  KEY `ACT_IDX_HI_ACT_INST_END` (`END_TIME_`),
  KEY `ACT_IDX_HI_ACT_INST_PROCINST` (`PROC_INST_ID_`,`ACT_ID_`),
  KEY `ACT_IDX_HI_ACT_INST_COMP` (`EXECUTION_ID_`,`ACT_ID_`,`END_TIME_`,`ID_`),
  KEY `ACT_IDX_HI_ACT_INST_STATS` (`PROC_DEF_ID_`,`PROC_INST_ID_`,`ACT_ID_`,`END_TIME_`,`ACT_INST_STATE_`),
  KEY `ACT_IDX_HI_ACT_INST_TENANT_ID` (`TENANT_ID_`),
  KEY `ACT_IDX_HI_ACT_INST_PROC_DEF_KEY` (`PROC_DEF_KEY_`),
  KEY `ACT_IDX_HI_AI_PDEFID_END_TIME` (`PROC_DEF_ID_`,`END_TIME_`),
  KEY `ACT_IDX_HI_ACT_INST_RM_TIME` (`REMOVAL_TIME_`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_hi_actinst`
--

LOCK TABLES `act_hi_actinst` WRITE;
/*!40000 ALTER TABLE `act_hi_actinst` DISABLE KEYS */;
/*!40000 ALTER TABLE `act_hi_actinst` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_hi_attachment`
--

DROP TABLE IF EXISTS `act_hi_attachment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_hi_attachment` (
  `ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `REV_` int DEFAULT NULL,
  `USER_ID_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `NAME_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `DESCRIPTION_` varchar(4000) COLLATE utf8mb3_bin DEFAULT NULL,
  `TYPE_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `TASK_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `ROOT_PROC_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `PROC_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `URL_` varchar(4000) COLLATE utf8mb3_bin DEFAULT NULL,
  `CONTENT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `TENANT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `CREATE_TIME_` datetime DEFAULT NULL,
  `REMOVAL_TIME_` datetime DEFAULT NULL,
  PRIMARY KEY (`ID_`),
  KEY `ACT_IDX_HI_ATTACHMENT_CONTENT` (`CONTENT_ID_`),
  KEY `ACT_IDX_HI_ATTACHMENT_ROOT_PI` (`ROOT_PROC_INST_ID_`),
  KEY `ACT_IDX_HI_ATTACHMENT_PROCINST` (`PROC_INST_ID_`),
  KEY `ACT_IDX_HI_ATTACHMENT_TASK` (`TASK_ID_`),
  KEY `ACT_IDX_HI_ATTACHMENT_RM_TIME` (`REMOVAL_TIME_`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_hi_attachment`
--

LOCK TABLES `act_hi_attachment` WRITE;
/*!40000 ALTER TABLE `act_hi_attachment` DISABLE KEYS */;
/*!40000 ALTER TABLE `act_hi_attachment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_hi_batch`
--

DROP TABLE IF EXISTS `act_hi_batch`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_hi_batch` (
  `ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `TYPE_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `TOTAL_JOBS_` int DEFAULT NULL,
  `JOBS_PER_SEED_` int DEFAULT NULL,
  `INVOCATIONS_PER_JOB_` int DEFAULT NULL,
  `SEED_JOB_DEF_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `MONITOR_JOB_DEF_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `BATCH_JOB_DEF_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `TENANT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `CREATE_USER_ID_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `START_TIME_` datetime NOT NULL,
  `END_TIME_` datetime DEFAULT NULL,
  `REMOVAL_TIME_` datetime DEFAULT NULL,
  `EXEC_START_TIME_` datetime DEFAULT NULL,
  PRIMARY KEY (`ID_`),
  KEY `ACT_HI_BAT_RM_TIME` (`REMOVAL_TIME_`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_hi_batch`
--

LOCK TABLES `act_hi_batch` WRITE;
/*!40000 ALTER TABLE `act_hi_batch` DISABLE KEYS */;
/*!40000 ALTER TABLE `act_hi_batch` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_hi_caseactinst`
--

DROP TABLE IF EXISTS `act_hi_caseactinst`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_hi_caseactinst` (
  `ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `PARENT_ACT_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `CASE_DEF_ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `CASE_INST_ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `CASE_ACT_ID_` varchar(255) COLLATE utf8mb3_bin NOT NULL,
  `TASK_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `CALL_PROC_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `CALL_CASE_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `CASE_ACT_NAME_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `CASE_ACT_TYPE_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `CREATE_TIME_` datetime NOT NULL,
  `END_TIME_` datetime DEFAULT NULL,
  `DURATION_` bigint DEFAULT NULL,
  `STATE_` int DEFAULT NULL,
  `REQUIRED_` tinyint(1) DEFAULT NULL,
  `TENANT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  PRIMARY KEY (`ID_`),
  KEY `ACT_IDX_HI_CAS_A_I_CREATE` (`CREATE_TIME_`),
  KEY `ACT_IDX_HI_CAS_A_I_END` (`END_TIME_`),
  KEY `ACT_IDX_HI_CAS_A_I_COMP` (`CASE_ACT_ID_`,`END_TIME_`,`ID_`),
  KEY `ACT_IDX_HI_CAS_A_I_CASEINST` (`CASE_INST_ID_`,`CASE_ACT_ID_`),
  KEY `ACT_IDX_HI_CAS_A_I_TENANT_ID` (`TENANT_ID_`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_hi_caseactinst`
--

LOCK TABLES `act_hi_caseactinst` WRITE;
/*!40000 ALTER TABLE `act_hi_caseactinst` DISABLE KEYS */;
/*!40000 ALTER TABLE `act_hi_caseactinst` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_hi_caseinst`
--

DROP TABLE IF EXISTS `act_hi_caseinst`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_hi_caseinst` (
  `ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `CASE_INST_ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `BUSINESS_KEY_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `CASE_DEF_ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `CREATE_TIME_` datetime NOT NULL,
  `CLOSE_TIME_` datetime DEFAULT NULL,
  `DURATION_` bigint DEFAULT NULL,
  `STATE_` int DEFAULT NULL,
  `CREATE_USER_ID_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `SUPER_CASE_INSTANCE_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `SUPER_PROCESS_INSTANCE_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `TENANT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  PRIMARY KEY (`ID_`),
  UNIQUE KEY `CASE_INST_ID_` (`CASE_INST_ID_`),
  KEY `ACT_IDX_HI_CAS_I_CLOSE` (`CLOSE_TIME_`),
  KEY `ACT_IDX_HI_CAS_I_BUSKEY` (`BUSINESS_KEY_`),
  KEY `ACT_IDX_HI_CAS_I_TENANT_ID` (`TENANT_ID_`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_hi_caseinst`
--

LOCK TABLES `act_hi_caseinst` WRITE;
/*!40000 ALTER TABLE `act_hi_caseinst` DISABLE KEYS */;
/*!40000 ALTER TABLE `act_hi_caseinst` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_hi_comment`
--

DROP TABLE IF EXISTS `act_hi_comment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_hi_comment` (
  `ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `TYPE_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `TIME_` datetime NOT NULL,
  `USER_ID_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `TASK_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `ROOT_PROC_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `PROC_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `ACTION_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `MESSAGE_` varchar(4000) COLLATE utf8mb3_bin DEFAULT NULL,
  `FULL_MSG_` longblob,
  `TENANT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `REMOVAL_TIME_` datetime DEFAULT NULL,
  PRIMARY KEY (`ID_`),
  KEY `ACT_IDX_HI_COMMENT_TASK` (`TASK_ID_`),
  KEY `ACT_IDX_HI_COMMENT_ROOT_PI` (`ROOT_PROC_INST_ID_`),
  KEY `ACT_IDX_HI_COMMENT_PROCINST` (`PROC_INST_ID_`),
  KEY `ACT_IDX_HI_COMMENT_RM_TIME` (`REMOVAL_TIME_`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_hi_comment`
--

LOCK TABLES `act_hi_comment` WRITE;
/*!40000 ALTER TABLE `act_hi_comment` DISABLE KEYS */;
/*!40000 ALTER TABLE `act_hi_comment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_hi_dec_in`
--

DROP TABLE IF EXISTS `act_hi_dec_in`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_hi_dec_in` (
  `ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `DEC_INST_ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `CLAUSE_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `CLAUSE_NAME_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `VAR_TYPE_` varchar(100) COLLATE utf8mb3_bin DEFAULT NULL,
  `BYTEARRAY_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `DOUBLE_` double DEFAULT NULL,
  `LONG_` bigint DEFAULT NULL,
  `TEXT_` varchar(4000) COLLATE utf8mb3_bin DEFAULT NULL,
  `TEXT2_` varchar(4000) COLLATE utf8mb3_bin DEFAULT NULL,
  `TENANT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `CREATE_TIME_` datetime DEFAULT NULL,
  `ROOT_PROC_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `REMOVAL_TIME_` datetime DEFAULT NULL,
  PRIMARY KEY (`ID_`),
  KEY `ACT_IDX_HI_DEC_IN_INST` (`DEC_INST_ID_`),
  KEY `ACT_IDX_HI_DEC_IN_CLAUSE` (`DEC_INST_ID_`,`CLAUSE_ID_`),
  KEY `ACT_IDX_HI_DEC_IN_ROOT_PI` (`ROOT_PROC_INST_ID_`),
  KEY `ACT_IDX_HI_DEC_IN_RM_TIME` (`REMOVAL_TIME_`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_hi_dec_in`
--

LOCK TABLES `act_hi_dec_in` WRITE;
/*!40000 ALTER TABLE `act_hi_dec_in` DISABLE KEYS */;
/*!40000 ALTER TABLE `act_hi_dec_in` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_hi_dec_out`
--

DROP TABLE IF EXISTS `act_hi_dec_out`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_hi_dec_out` (
  `ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `DEC_INST_ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `CLAUSE_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `CLAUSE_NAME_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `RULE_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `RULE_ORDER_` int DEFAULT NULL,
  `VAR_NAME_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `VAR_TYPE_` varchar(100) COLLATE utf8mb3_bin DEFAULT NULL,
  `BYTEARRAY_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `DOUBLE_` double DEFAULT NULL,
  `LONG_` bigint DEFAULT NULL,
  `TEXT_` varchar(4000) COLLATE utf8mb3_bin DEFAULT NULL,
  `TEXT2_` varchar(4000) COLLATE utf8mb3_bin DEFAULT NULL,
  `TENANT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `CREATE_TIME_` datetime DEFAULT NULL,
  `ROOT_PROC_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `REMOVAL_TIME_` datetime DEFAULT NULL,
  PRIMARY KEY (`ID_`),
  KEY `ACT_IDX_HI_DEC_OUT_INST` (`DEC_INST_ID_`),
  KEY `ACT_IDX_HI_DEC_OUT_RULE` (`RULE_ORDER_`,`CLAUSE_ID_`),
  KEY `ACT_IDX_HI_DEC_OUT_ROOT_PI` (`ROOT_PROC_INST_ID_`),
  KEY `ACT_IDX_HI_DEC_OUT_RM_TIME` (`REMOVAL_TIME_`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_hi_dec_out`
--

LOCK TABLES `act_hi_dec_out` WRITE;
/*!40000 ALTER TABLE `act_hi_dec_out` DISABLE KEYS */;
/*!40000 ALTER TABLE `act_hi_dec_out` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_hi_decinst`
--

DROP TABLE IF EXISTS `act_hi_decinst`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_hi_decinst` (
  `ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `DEC_DEF_ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `DEC_DEF_KEY_` varchar(255) COLLATE utf8mb3_bin NOT NULL,
  `DEC_DEF_NAME_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `PROC_DEF_KEY_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `PROC_DEF_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `PROC_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `CASE_DEF_KEY_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `CASE_DEF_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `CASE_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `ACT_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `ACT_ID_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `EVAL_TIME_` datetime NOT NULL,
  `REMOVAL_TIME_` datetime DEFAULT NULL,
  `COLLECT_VALUE_` double DEFAULT NULL,
  `USER_ID_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `ROOT_DEC_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `ROOT_PROC_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `DEC_REQ_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `DEC_REQ_KEY_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `TENANT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  PRIMARY KEY (`ID_`),
  KEY `ACT_IDX_HI_DEC_INST_ID` (`DEC_DEF_ID_`),
  KEY `ACT_IDX_HI_DEC_INST_KEY` (`DEC_DEF_KEY_`),
  KEY `ACT_IDX_HI_DEC_INST_PI` (`PROC_INST_ID_`),
  KEY `ACT_IDX_HI_DEC_INST_CI` (`CASE_INST_ID_`),
  KEY `ACT_IDX_HI_DEC_INST_ACT` (`ACT_ID_`),
  KEY `ACT_IDX_HI_DEC_INST_ACT_INST` (`ACT_INST_ID_`),
  KEY `ACT_IDX_HI_DEC_INST_TIME` (`EVAL_TIME_`),
  KEY `ACT_IDX_HI_DEC_INST_TENANT_ID` (`TENANT_ID_`),
  KEY `ACT_IDX_HI_DEC_INST_ROOT_ID` (`ROOT_DEC_INST_ID_`),
  KEY `ACT_IDX_HI_DEC_INST_REQ_ID` (`DEC_REQ_ID_`),
  KEY `ACT_IDX_HI_DEC_INST_REQ_KEY` (`DEC_REQ_KEY_`),
  KEY `ACT_IDX_HI_DEC_INST_ROOT_PI` (`ROOT_PROC_INST_ID_`),
  KEY `ACT_IDX_HI_DEC_INST_RM_TIME` (`REMOVAL_TIME_`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_hi_decinst`
--

LOCK TABLES `act_hi_decinst` WRITE;
/*!40000 ALTER TABLE `act_hi_decinst` DISABLE KEYS */;
/*!40000 ALTER TABLE `act_hi_decinst` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_hi_detail`
--

DROP TABLE IF EXISTS `act_hi_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_hi_detail` (
  `ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `TYPE_` varchar(255) COLLATE utf8mb3_bin NOT NULL,
  `PROC_DEF_KEY_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `PROC_DEF_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `ROOT_PROC_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `PROC_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `EXECUTION_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `CASE_DEF_KEY_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `CASE_DEF_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `CASE_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `CASE_EXECUTION_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `TASK_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `ACT_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `VAR_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `NAME_` varchar(255) COLLATE utf8mb3_bin NOT NULL,
  `VAR_TYPE_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `REV_` int DEFAULT NULL,
  `TIME_` datetime NOT NULL,
  `BYTEARRAY_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `DOUBLE_` double DEFAULT NULL,
  `LONG_` bigint DEFAULT NULL,
  `TEXT_` varchar(4000) COLLATE utf8mb3_bin DEFAULT NULL,
  `TEXT2_` varchar(4000) COLLATE utf8mb3_bin DEFAULT NULL,
  `SEQUENCE_COUNTER_` bigint DEFAULT NULL,
  `TENANT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `OPERATION_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `REMOVAL_TIME_` datetime DEFAULT NULL,
  `INITIAL_` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`ID_`),
  KEY `ACT_IDX_HI_DETAIL_ROOT_PI` (`ROOT_PROC_INST_ID_`),
  KEY `ACT_IDX_HI_DETAIL_PROC_INST` (`PROC_INST_ID_`),
  KEY `ACT_IDX_HI_DETAIL_ACT_INST` (`ACT_INST_ID_`),
  KEY `ACT_IDX_HI_DETAIL_CASE_INST` (`CASE_INST_ID_`),
  KEY `ACT_IDX_HI_DETAIL_CASE_EXEC` (`CASE_EXECUTION_ID_`),
  KEY `ACT_IDX_HI_DETAIL_TIME` (`TIME_`),
  KEY `ACT_IDX_HI_DETAIL_NAME` (`NAME_`),
  KEY `ACT_IDX_HI_DETAIL_TASK_ID` (`TASK_ID_`),
  KEY `ACT_IDX_HI_DETAIL_TENANT_ID` (`TENANT_ID_`),
  KEY `ACT_IDX_HI_DETAIL_PROC_DEF_KEY` (`PROC_DEF_KEY_`),
  KEY `ACT_IDX_HI_DETAIL_BYTEAR` (`BYTEARRAY_ID_`),
  KEY `ACT_IDX_HI_DETAIL_RM_TIME` (`REMOVAL_TIME_`),
  KEY `ACT_IDX_HI_DETAIL_TASK_BYTEAR` (`BYTEARRAY_ID_`,`TASK_ID_`),
  KEY `ACT_IDX_HI_DETAIL_VAR_INST_ID` (`VAR_INST_ID_`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_hi_detail`
--

LOCK TABLES `act_hi_detail` WRITE;
/*!40000 ALTER TABLE `act_hi_detail` DISABLE KEYS */;
/*!40000 ALTER TABLE `act_hi_detail` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_hi_ext_task_log`
--

DROP TABLE IF EXISTS `act_hi_ext_task_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_hi_ext_task_log` (
  `ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `TIMESTAMP_` timestamp NOT NULL,
  `EXT_TASK_ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `RETRIES_` int DEFAULT NULL,
  `TOPIC_NAME_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `WORKER_ID_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `PRIORITY_` bigint NOT NULL DEFAULT '0',
  `ERROR_MSG_` varchar(4000) COLLATE utf8mb3_bin DEFAULT NULL,
  `ERROR_DETAILS_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `ACT_ID_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `ACT_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `EXECUTION_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `ROOT_PROC_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `PROC_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `PROC_DEF_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `PROC_DEF_KEY_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `TENANT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `STATE_` int DEFAULT NULL,
  `REV_` int DEFAULT NULL,
  `REMOVAL_TIME_` datetime DEFAULT NULL,
  PRIMARY KEY (`ID_`),
  KEY `ACT_HI_EXT_TASK_LOG_ROOT_PI` (`ROOT_PROC_INST_ID_`),
  KEY `ACT_HI_EXT_TASK_LOG_PROCINST` (`PROC_INST_ID_`),
  KEY `ACT_HI_EXT_TASK_LOG_PROCDEF` (`PROC_DEF_ID_`),
  KEY `ACT_HI_EXT_TASK_LOG_PROC_DEF_KEY` (`PROC_DEF_KEY_`),
  KEY `ACT_HI_EXT_TASK_LOG_TENANT_ID` (`TENANT_ID_`),
  KEY `ACT_IDX_HI_EXTTASKLOG_ERRORDET` (`ERROR_DETAILS_ID_`),
  KEY `ACT_HI_EXT_TASK_LOG_RM_TIME` (`REMOVAL_TIME_`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_hi_ext_task_log`
--

LOCK TABLES `act_hi_ext_task_log` WRITE;
/*!40000 ALTER TABLE `act_hi_ext_task_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `act_hi_ext_task_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_hi_identitylink`
--

DROP TABLE IF EXISTS `act_hi_identitylink`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_hi_identitylink` (
  `ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `TIMESTAMP_` timestamp NOT NULL,
  `TYPE_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `USER_ID_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `GROUP_ID_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `TASK_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `ROOT_PROC_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `PROC_DEF_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `OPERATION_TYPE_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `ASSIGNER_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `PROC_DEF_KEY_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `TENANT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `REMOVAL_TIME_` datetime DEFAULT NULL,
  PRIMARY KEY (`ID_`),
  KEY `ACT_IDX_HI_IDENT_LNK_ROOT_PI` (`ROOT_PROC_INST_ID_`),
  KEY `ACT_IDX_HI_IDENT_LNK_USER` (`USER_ID_`),
  KEY `ACT_IDX_HI_IDENT_LNK_GROUP` (`GROUP_ID_`),
  KEY `ACT_IDX_HI_IDENT_LNK_TENANT_ID` (`TENANT_ID_`),
  KEY `ACT_IDX_HI_IDENT_LNK_PROC_DEF_KEY` (`PROC_DEF_KEY_`),
  KEY `ACT_IDX_HI_IDENT_LINK_TASK` (`TASK_ID_`),
  KEY `ACT_IDX_HI_IDENT_LINK_RM_TIME` (`REMOVAL_TIME_`),
  KEY `ACT_IDX_HI_IDENT_LNK_TIMESTAMP` (`TIMESTAMP_`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_hi_identitylink`
--

LOCK TABLES `act_hi_identitylink` WRITE;
/*!40000 ALTER TABLE `act_hi_identitylink` DISABLE KEYS */;
/*!40000 ALTER TABLE `act_hi_identitylink` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_hi_incident`
--

DROP TABLE IF EXISTS `act_hi_incident`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_hi_incident` (
  `ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `PROC_DEF_KEY_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `PROC_DEF_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `ROOT_PROC_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `PROC_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `EXECUTION_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `CREATE_TIME_` timestamp NOT NULL,
  `END_TIME_` timestamp NULL DEFAULT NULL,
  `INCIDENT_MSG_` varchar(4000) COLLATE utf8mb3_bin DEFAULT NULL,
  `INCIDENT_TYPE_` varchar(255) COLLATE utf8mb3_bin NOT NULL,
  `ACTIVITY_ID_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `FAILED_ACTIVITY_ID_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `CAUSE_INCIDENT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `ROOT_CAUSE_INCIDENT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `CONFIGURATION_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `HISTORY_CONFIGURATION_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `INCIDENT_STATE_` int DEFAULT NULL,
  `TENANT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `JOB_DEF_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `ANNOTATION_` varchar(4000) COLLATE utf8mb3_bin DEFAULT NULL,
  `REMOVAL_TIME_` datetime DEFAULT NULL,
  PRIMARY KEY (`ID_`),
  KEY `ACT_IDX_HI_INCIDENT_TENANT_ID` (`TENANT_ID_`),
  KEY `ACT_IDX_HI_INCIDENT_PROC_DEF_KEY` (`PROC_DEF_KEY_`),
  KEY `ACT_IDX_HI_INCIDENT_ROOT_PI` (`ROOT_PROC_INST_ID_`),
  KEY `ACT_IDX_HI_INCIDENT_PROCINST` (`PROC_INST_ID_`),
  KEY `ACT_IDX_HI_INCIDENT_RM_TIME` (`REMOVAL_TIME_`),
  KEY `ACT_IDX_HI_INCIDENT_CREATE_TIME` (`CREATE_TIME_`),
  KEY `ACT_IDX_HI_INCIDENT_END_TIME` (`END_TIME_`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_hi_incident`
--

LOCK TABLES `act_hi_incident` WRITE;
/*!40000 ALTER TABLE `act_hi_incident` DISABLE KEYS */;
/*!40000 ALTER TABLE `act_hi_incident` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_hi_job_log`
--

DROP TABLE IF EXISTS `act_hi_job_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_hi_job_log` (
  `ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `TIMESTAMP_` datetime NOT NULL,
  `JOB_ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `JOB_DUEDATE_` datetime DEFAULT NULL,
  `JOB_RETRIES_` int DEFAULT NULL,
  `JOB_PRIORITY_` bigint NOT NULL DEFAULT '0',
  `JOB_EXCEPTION_MSG_` varchar(4000) COLLATE utf8mb3_bin DEFAULT NULL,
  `JOB_EXCEPTION_STACK_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `JOB_STATE_` int DEFAULT NULL,
  `JOB_DEF_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `JOB_DEF_TYPE_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `JOB_DEF_CONFIGURATION_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `ACT_ID_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `FAILED_ACT_ID_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `EXECUTION_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `ROOT_PROC_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `PROCESS_INSTANCE_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `PROCESS_DEF_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `PROCESS_DEF_KEY_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `DEPLOYMENT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `SEQUENCE_COUNTER_` bigint DEFAULT NULL,
  `TENANT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `HOSTNAME_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `REMOVAL_TIME_` datetime DEFAULT NULL,
  PRIMARY KEY (`ID_`),
  KEY `ACT_IDX_HI_JOB_LOG_ROOT_PI` (`ROOT_PROC_INST_ID_`),
  KEY `ACT_IDX_HI_JOB_LOG_PROCINST` (`PROCESS_INSTANCE_ID_`),
  KEY `ACT_IDX_HI_JOB_LOG_PROCDEF` (`PROCESS_DEF_ID_`),
  KEY `ACT_IDX_HI_JOB_LOG_TENANT_ID` (`TENANT_ID_`),
  KEY `ACT_IDX_HI_JOB_LOG_JOB_DEF_ID` (`JOB_DEF_ID_`),
  KEY `ACT_IDX_HI_JOB_LOG_PROC_DEF_KEY` (`PROCESS_DEF_KEY_`),
  KEY `ACT_IDX_HI_JOB_LOG_EX_STACK` (`JOB_EXCEPTION_STACK_ID_`),
  KEY `ACT_IDX_HI_JOB_LOG_RM_TIME` (`REMOVAL_TIME_`),
  KEY `ACT_IDX_HI_JOB_LOG_JOB_CONF` (`JOB_DEF_CONFIGURATION_`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_hi_job_log`
--

LOCK TABLES `act_hi_job_log` WRITE;
/*!40000 ALTER TABLE `act_hi_job_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `act_hi_job_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_hi_op_log`
--

DROP TABLE IF EXISTS `act_hi_op_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_hi_op_log` (
  `ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `DEPLOYMENT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `PROC_DEF_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `PROC_DEF_KEY_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `ROOT_PROC_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `PROC_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `EXECUTION_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `CASE_DEF_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `CASE_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `CASE_EXECUTION_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `TASK_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `JOB_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `JOB_DEF_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `BATCH_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `USER_ID_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `TIMESTAMP_` timestamp NOT NULL,
  `OPERATION_TYPE_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `OPERATION_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `ENTITY_TYPE_` varchar(30) COLLATE utf8mb3_bin DEFAULT NULL,
  `PROPERTY_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `ORG_VALUE_` varchar(4000) COLLATE utf8mb3_bin DEFAULT NULL,
  `NEW_VALUE_` varchar(4000) COLLATE utf8mb3_bin DEFAULT NULL,
  `TENANT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `REMOVAL_TIME_` datetime DEFAULT NULL,
  `CATEGORY_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `EXTERNAL_TASK_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `ANNOTATION_` varchar(4000) COLLATE utf8mb3_bin DEFAULT NULL,
  PRIMARY KEY (`ID_`),
  KEY `ACT_IDX_HI_OP_LOG_ROOT_PI` (`ROOT_PROC_INST_ID_`),
  KEY `ACT_IDX_HI_OP_LOG_PROCINST` (`PROC_INST_ID_`),
  KEY `ACT_IDX_HI_OP_LOG_PROCDEF` (`PROC_DEF_ID_`),
  KEY `ACT_IDX_HI_OP_LOG_TASK` (`TASK_ID_`),
  KEY `ACT_IDX_HI_OP_LOG_RM_TIME` (`REMOVAL_TIME_`),
  KEY `ACT_IDX_HI_OP_LOG_TIMESTAMP` (`TIMESTAMP_`),
  KEY `ACT_IDX_HI_OP_LOG_USER_ID` (`USER_ID_`),
  KEY `ACT_IDX_HI_OP_LOG_OP_TYPE` (`OPERATION_TYPE_`),
  KEY `ACT_IDX_HI_OP_LOG_ENTITY_TYPE` (`ENTITY_TYPE_`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_hi_op_log`
--

LOCK TABLES `act_hi_op_log` WRITE;
/*!40000 ALTER TABLE `act_hi_op_log` DISABLE KEYS */;
INSERT INTO `act_hi_op_log` VALUES ('bcd10f17-e9e7-11f0-aec6-7015fbb5741b',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'admin','2026-01-05 03:36:36','Update','bcd10f16-e9e7-11f0-aec6-7015fbb5741b','Property','name',NULL,'camunda.telemetry.enabled',NULL,NULL,'Admin',NULL,NULL);
/*!40000 ALTER TABLE `act_hi_op_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_hi_procinst`
--

DROP TABLE IF EXISTS `act_hi_procinst`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_hi_procinst` (
  `ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `PROC_INST_ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `BUSINESS_KEY_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `PROC_DEF_KEY_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `PROC_DEF_ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `START_TIME_` datetime NOT NULL,
  `END_TIME_` datetime DEFAULT NULL,
  `REMOVAL_TIME_` datetime DEFAULT NULL,
  `DURATION_` bigint DEFAULT NULL,
  `START_USER_ID_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `START_ACT_ID_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `END_ACT_ID_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `SUPER_PROCESS_INSTANCE_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `ROOT_PROC_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `SUPER_CASE_INSTANCE_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `CASE_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `DELETE_REASON_` varchar(4000) COLLATE utf8mb3_bin DEFAULT NULL,
  `TENANT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `STATE_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  PRIMARY KEY (`ID_`),
  UNIQUE KEY `PROC_INST_ID_` (`PROC_INST_ID_`),
  KEY `ACT_IDX_HI_PRO_INST_END` (`END_TIME_`),
  KEY `ACT_IDX_HI_PRO_I_BUSKEY` (`BUSINESS_KEY_`),
  KEY `ACT_IDX_HI_PRO_INST_TENANT_ID` (`TENANT_ID_`),
  KEY `ACT_IDX_HI_PRO_INST_PROC_DEF_KEY` (`PROC_DEF_KEY_`),
  KEY `ACT_IDX_HI_PRO_INST_PROC_TIME` (`START_TIME_`,`END_TIME_`),
  KEY `ACT_IDX_HI_PI_PDEFID_END_TIME` (`PROC_DEF_ID_`,`END_TIME_`),
  KEY `ACT_IDX_HI_PRO_INST_ROOT_PI` (`ROOT_PROC_INST_ID_`),
  KEY `ACT_IDX_HI_PRO_INST_RM_TIME` (`REMOVAL_TIME_`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_hi_procinst`
--

LOCK TABLES `act_hi_procinst` WRITE;
/*!40000 ALTER TABLE `act_hi_procinst` DISABLE KEYS */;
/*!40000 ALTER TABLE `act_hi_procinst` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_hi_taskinst`
--

DROP TABLE IF EXISTS `act_hi_taskinst`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_hi_taskinst` (
  `ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `TASK_DEF_KEY_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `PROC_DEF_KEY_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `PROC_DEF_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `ROOT_PROC_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `PROC_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `EXECUTION_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `CASE_DEF_KEY_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `CASE_DEF_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `CASE_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `CASE_EXECUTION_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `ACT_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `NAME_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `PARENT_TASK_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `DESCRIPTION_` varchar(4000) COLLATE utf8mb3_bin DEFAULT NULL,
  `OWNER_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `ASSIGNEE_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `START_TIME_` datetime NOT NULL,
  `END_TIME_` datetime DEFAULT NULL,
  `DURATION_` bigint DEFAULT NULL,
  `DELETE_REASON_` varchar(4000) COLLATE utf8mb3_bin DEFAULT NULL,
  `PRIORITY_` int DEFAULT NULL,
  `DUE_DATE_` datetime DEFAULT NULL,
  `FOLLOW_UP_DATE_` datetime DEFAULT NULL,
  `TENANT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `REMOVAL_TIME_` datetime DEFAULT NULL,
  PRIMARY KEY (`ID_`),
  KEY `ACT_IDX_HI_TASKINST_ROOT_PI` (`ROOT_PROC_INST_ID_`),
  KEY `ACT_IDX_HI_TASK_INST_TENANT_ID` (`TENANT_ID_`),
  KEY `ACT_IDX_HI_TASK_INST_PROC_DEF_KEY` (`PROC_DEF_KEY_`),
  KEY `ACT_IDX_HI_TASKINST_PROCINST` (`PROC_INST_ID_`),
  KEY `ACT_IDX_HI_TASKINSTID_PROCINST` (`ID_`,`PROC_INST_ID_`),
  KEY `ACT_IDX_HI_TASK_INST_RM_TIME` (`REMOVAL_TIME_`),
  KEY `ACT_IDX_HI_TASK_INST_START` (`START_TIME_`),
  KEY `ACT_IDX_HI_TASK_INST_END` (`END_TIME_`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_hi_taskinst`
--

LOCK TABLES `act_hi_taskinst` WRITE;
/*!40000 ALTER TABLE `act_hi_taskinst` DISABLE KEYS */;
/*!40000 ALTER TABLE `act_hi_taskinst` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_hi_varinst`
--

DROP TABLE IF EXISTS `act_hi_varinst`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_hi_varinst` (
  `ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `PROC_DEF_KEY_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `PROC_DEF_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `ROOT_PROC_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `PROC_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `EXECUTION_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `ACT_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `CASE_DEF_KEY_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `CASE_DEF_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `CASE_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `CASE_EXECUTION_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `TASK_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `NAME_` varchar(255) COLLATE utf8mb3_bin NOT NULL,
  `VAR_TYPE_` varchar(100) COLLATE utf8mb3_bin DEFAULT NULL,
  `CREATE_TIME_` datetime DEFAULT NULL,
  `REV_` int DEFAULT NULL,
  `BYTEARRAY_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `DOUBLE_` double DEFAULT NULL,
  `LONG_` bigint DEFAULT NULL,
  `TEXT_` varchar(4000) COLLATE utf8mb3_bin DEFAULT NULL,
  `TEXT2_` varchar(4000) COLLATE utf8mb3_bin DEFAULT NULL,
  `TENANT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `STATE_` varchar(20) COLLATE utf8mb3_bin DEFAULT NULL,
  `REMOVAL_TIME_` datetime DEFAULT NULL,
  PRIMARY KEY (`ID_`),
  KEY `ACT_IDX_HI_VARINST_ROOT_PI` (`ROOT_PROC_INST_ID_`),
  KEY `ACT_IDX_HI_PROCVAR_PROC_INST` (`PROC_INST_ID_`),
  KEY `ACT_IDX_HI_PROCVAR_NAME_TYPE` (`NAME_`,`VAR_TYPE_`),
  KEY `ACT_IDX_HI_CASEVAR_CASE_INST` (`CASE_INST_ID_`),
  KEY `ACT_IDX_HI_VAR_INST_TENANT_ID` (`TENANT_ID_`),
  KEY `ACT_IDX_HI_VAR_INST_PROC_DEF_KEY` (`PROC_DEF_KEY_`),
  KEY `ACT_IDX_HI_VARINST_BYTEAR` (`BYTEARRAY_ID_`),
  KEY `ACT_IDX_HI_VARINST_RM_TIME` (`REMOVAL_TIME_`),
  KEY `ACT_IDX_HI_VAR_PI_NAME_TYPE` (`PROC_INST_ID_`,`NAME_`,`VAR_TYPE_`),
  KEY `ACT_IDX_HI_VARINST_NAME` (`NAME_`),
  KEY `ACT_IDX_HI_VARINST_ACT_INST_ID` (`ACT_INST_ID_`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_hi_varinst`
--

LOCK TABLES `act_hi_varinst` WRITE;
/*!40000 ALTER TABLE `act_hi_varinst` DISABLE KEYS */;
/*!40000 ALTER TABLE `act_hi_varinst` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_id_group`
--

DROP TABLE IF EXISTS `act_id_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_id_group` (
  `ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `REV_` int DEFAULT NULL,
  `NAME_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `TYPE_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  PRIMARY KEY (`ID_`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_id_group`
--

LOCK TABLES `act_id_group` WRITE;
/*!40000 ALTER TABLE `act_id_group` DISABLE KEYS */;
INSERT INTO `act_id_group` VALUES ('camunda-admin',1,'camunda BPM Administrators','SYSTEM');
/*!40000 ALTER TABLE `act_id_group` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_id_info`
--

DROP TABLE IF EXISTS `act_id_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_id_info` (
  `ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `REV_` int DEFAULT NULL,
  `USER_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `TYPE_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `KEY_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `VALUE_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `PASSWORD_` longblob,
  `PARENT_ID_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  PRIMARY KEY (`ID_`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_id_info`
--

LOCK TABLES `act_id_info` WRITE;
/*!40000 ALTER TABLE `act_id_info` DISABLE KEYS */;
/*!40000 ALTER TABLE `act_id_info` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_id_membership`
--

DROP TABLE IF EXISTS `act_id_membership`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_id_membership` (
  `USER_ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `GROUP_ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  PRIMARY KEY (`USER_ID_`,`GROUP_ID_`),
  KEY `ACT_FK_MEMB_GROUP` (`GROUP_ID_`),
  CONSTRAINT `ACT_FK_MEMB_GROUP` FOREIGN KEY (`GROUP_ID_`) REFERENCES `act_id_group` (`ID_`),
  CONSTRAINT `ACT_FK_MEMB_USER` FOREIGN KEY (`USER_ID_`) REFERENCES `act_id_user` (`ID_`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_id_membership`
--

LOCK TABLES `act_id_membership` WRITE;
/*!40000 ALTER TABLE `act_id_membership` DISABLE KEYS */;
INSERT INTO `act_id_membership` VALUES ('admin','camunda-admin');
/*!40000 ALTER TABLE `act_id_membership` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_id_tenant`
--

DROP TABLE IF EXISTS `act_id_tenant`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_id_tenant` (
  `ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `REV_` int DEFAULT NULL,
  `NAME_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  PRIMARY KEY (`ID_`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_id_tenant`
--

LOCK TABLES `act_id_tenant` WRITE;
/*!40000 ALTER TABLE `act_id_tenant` DISABLE KEYS */;
/*!40000 ALTER TABLE `act_id_tenant` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_id_tenant_member`
--

DROP TABLE IF EXISTS `act_id_tenant_member`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_id_tenant_member` (
  `ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `TENANT_ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `USER_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `GROUP_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  PRIMARY KEY (`ID_`),
  UNIQUE KEY `ACT_UNIQ_TENANT_MEMB_USER` (`TENANT_ID_`,`USER_ID_`),
  UNIQUE KEY `ACT_UNIQ_TENANT_MEMB_GROUP` (`TENANT_ID_`,`GROUP_ID_`),
  KEY `ACT_FK_TENANT_MEMB_USER` (`USER_ID_`),
  KEY `ACT_FK_TENANT_MEMB_GROUP` (`GROUP_ID_`),
  CONSTRAINT `ACT_FK_TENANT_MEMB` FOREIGN KEY (`TENANT_ID_`) REFERENCES `act_id_tenant` (`ID_`),
  CONSTRAINT `ACT_FK_TENANT_MEMB_GROUP` FOREIGN KEY (`GROUP_ID_`) REFERENCES `act_id_group` (`ID_`),
  CONSTRAINT `ACT_FK_TENANT_MEMB_USER` FOREIGN KEY (`USER_ID_`) REFERENCES `act_id_user` (`ID_`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_id_tenant_member`
--

LOCK TABLES `act_id_tenant_member` WRITE;
/*!40000 ALTER TABLE `act_id_tenant_member` DISABLE KEYS */;
/*!40000 ALTER TABLE `act_id_tenant_member` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_id_user`
--

DROP TABLE IF EXISTS `act_id_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_id_user` (
  `ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `REV_` int DEFAULT NULL,
  `FIRST_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `LAST_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `EMAIL_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `PWD_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `SALT_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `LOCK_EXP_TIME_` datetime DEFAULT NULL,
  `ATTEMPTS_` int DEFAULT NULL,
  `PICTURE_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  PRIMARY KEY (`ID_`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_id_user`
--

LOCK TABLES `act_id_user` WRITE;
/*!40000 ALTER TABLE `act_id_user` DISABLE KEYS */;
INSERT INTO `act_id_user` VALUES ('admin',1,'Admin','Admin','admin@localhost','{SHA-512}jlE5hWH5MSa9z4APJ+fLjtZyNOKMu3VBeKLMcWUbgvAlnPXq6CspZg59Ob3k/IvKf1owS9+tmjYYvkkl80GSuQ==','4ubX4HoSKnfYARrNW7vmTQ==',NULL,NULL,NULL);
/*!40000 ALTER TABLE `act_id_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_re_camformdef`
--

DROP TABLE IF EXISTS `act_re_camformdef`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_re_camformdef` (
  `ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `REV_` int DEFAULT NULL,
  `KEY_` varchar(255) COLLATE utf8mb3_bin NOT NULL,
  `VERSION_` int NOT NULL,
  `DEPLOYMENT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `RESOURCE_NAME_` varchar(4000) COLLATE utf8mb3_bin DEFAULT NULL,
  `TENANT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  PRIMARY KEY (`ID_`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_re_camformdef`
--

LOCK TABLES `act_re_camformdef` WRITE;
/*!40000 ALTER TABLE `act_re_camformdef` DISABLE KEYS */;
/*!40000 ALTER TABLE `act_re_camformdef` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_re_case_def`
--

DROP TABLE IF EXISTS `act_re_case_def`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_re_case_def` (
  `ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `REV_` int DEFAULT NULL,
  `CATEGORY_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `NAME_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `KEY_` varchar(255) COLLATE utf8mb3_bin NOT NULL,
  `VERSION_` int NOT NULL,
  `DEPLOYMENT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `RESOURCE_NAME_` varchar(4000) COLLATE utf8mb3_bin DEFAULT NULL,
  `DGRM_RESOURCE_NAME_` varchar(4000) COLLATE utf8mb3_bin DEFAULT NULL,
  `TENANT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `HISTORY_TTL_` int DEFAULT NULL,
  PRIMARY KEY (`ID_`),
  KEY `ACT_IDX_CASE_DEF_TENANT_ID` (`TENANT_ID_`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_re_case_def`
--

LOCK TABLES `act_re_case_def` WRITE;
/*!40000 ALTER TABLE `act_re_case_def` DISABLE KEYS */;
/*!40000 ALTER TABLE `act_re_case_def` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_re_decision_def`
--

DROP TABLE IF EXISTS `act_re_decision_def`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_re_decision_def` (
  `ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `REV_` int DEFAULT NULL,
  `CATEGORY_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `NAME_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `KEY_` varchar(255) COLLATE utf8mb3_bin NOT NULL,
  `VERSION_` int NOT NULL,
  `DEPLOYMENT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `RESOURCE_NAME_` varchar(4000) COLLATE utf8mb3_bin DEFAULT NULL,
  `DGRM_RESOURCE_NAME_` varchar(4000) COLLATE utf8mb3_bin DEFAULT NULL,
  `DEC_REQ_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `DEC_REQ_KEY_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `TENANT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `HISTORY_TTL_` int DEFAULT NULL,
  `VERSION_TAG_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  PRIMARY KEY (`ID_`),
  KEY `ACT_IDX_DEC_DEF_TENANT_ID` (`TENANT_ID_`),
  KEY `ACT_IDX_DEC_DEF_REQ_ID` (`DEC_REQ_ID_`),
  CONSTRAINT `ACT_FK_DEC_REQ` FOREIGN KEY (`DEC_REQ_ID_`) REFERENCES `act_re_decision_req_def` (`ID_`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_re_decision_def`
--

LOCK TABLES `act_re_decision_def` WRITE;
/*!40000 ALTER TABLE `act_re_decision_def` DISABLE KEYS */;
/*!40000 ALTER TABLE `act_re_decision_def` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_re_decision_req_def`
--

DROP TABLE IF EXISTS `act_re_decision_req_def`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_re_decision_req_def` (
  `ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `REV_` int DEFAULT NULL,
  `CATEGORY_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `NAME_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `KEY_` varchar(255) COLLATE utf8mb3_bin NOT NULL,
  `VERSION_` int NOT NULL,
  `DEPLOYMENT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `RESOURCE_NAME_` varchar(4000) COLLATE utf8mb3_bin DEFAULT NULL,
  `DGRM_RESOURCE_NAME_` varchar(4000) COLLATE utf8mb3_bin DEFAULT NULL,
  `TENANT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  PRIMARY KEY (`ID_`),
  KEY `ACT_IDX_DEC_REQ_DEF_TENANT_ID` (`TENANT_ID_`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_re_decision_req_def`
--

LOCK TABLES `act_re_decision_req_def` WRITE;
/*!40000 ALTER TABLE `act_re_decision_req_def` DISABLE KEYS */;
/*!40000 ALTER TABLE `act_re_decision_req_def` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_re_deployment`
--

DROP TABLE IF EXISTS `act_re_deployment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_re_deployment` (
  `ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `NAME_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `DEPLOY_TIME_` datetime DEFAULT NULL,
  `SOURCE_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `TENANT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  PRIMARY KEY (`ID_`),
  KEY `ACT_IDX_DEPLOYMENT_NAME` (`NAME_`),
  KEY `ACT_IDX_DEPLOYMENT_TENANT_ID` (`TENANT_ID_`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_re_deployment`
--

LOCK TABLES `act_re_deployment` WRITE;
/*!40000 ALTER TABLE `act_re_deployment` DISABLE KEYS */;
INSERT INTO `act_re_deployment` VALUES ('1bcde254-eb6f-11f0-ac3e-7015fbb5741b','SpringAutoDeployment','2026-01-07 02:18:09',NULL,NULL),('1c3543ce-eab8-11f0-8c59-7015fbb5741b','SpringAutoDeployment','2026-01-06 04:28:12',NULL,NULL),('1d4e3560-e9e6-11f0-b01e-7015fbb5741b','SpringAutoDeployment','2026-01-05 03:24:59',NULL,NULL),('8471324f-ea8b-11f0-938c-7015fbb5741b','SpringAutoDeployment','2026-01-05 23:08:59',NULL,NULL);
/*!40000 ALTER TABLE `act_re_deployment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_re_procdef`
--

DROP TABLE IF EXISTS `act_re_procdef`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_re_procdef` (
  `ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `REV_` int DEFAULT NULL,
  `CATEGORY_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `NAME_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `KEY_` varchar(255) COLLATE utf8mb3_bin NOT NULL,
  `VERSION_` int NOT NULL,
  `DEPLOYMENT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `RESOURCE_NAME_` varchar(4000) COLLATE utf8mb3_bin DEFAULT NULL,
  `DGRM_RESOURCE_NAME_` varchar(4000) COLLATE utf8mb3_bin DEFAULT NULL,
  `HAS_START_FORM_KEY_` tinyint DEFAULT NULL,
  `SUSPENSION_STATE_` int DEFAULT NULL,
  `TENANT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `VERSION_TAG_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `HISTORY_TTL_` int DEFAULT NULL,
  `STARTABLE_` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`ID_`),
  KEY `ACT_IDX_PROCDEF_DEPLOYMENT_ID` (`DEPLOYMENT_ID_`),
  KEY `ACT_IDX_PROCDEF_TENANT_ID` (`TENANT_ID_`),
  KEY `ACT_IDX_PROCDEF_VER_TAG` (`VERSION_TAG_`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_re_procdef`
--

LOCK TABLES `act_re_procdef` WRITE;
/*!40000 ALTER TABLE `act_re_procdef` DISABLE KEYS */;
INSERT INTO `act_re_procdef` VALUES ('ticket-correction-process:1:1d61e472-e9e6-11f0-b01e-7015fbb5741b',1,'http://bpmn.io/schema/bpmn','Ticket Correction Workflow','ticket-correction-process',1,'1d4e3560-e9e6-11f0-b01e-7015fbb5741b','C:\\Users\\Laptop-ALSACI\\Documents\\Projet Dev\\bank-data-quality-monitor-v13\\backend-java\\target\\classes\\bpmn\\ticket-workflow.bpmn',NULL,0,1,NULL,NULL,180,1),('ticket-correction-process:2:8486dd31-ea8b-11f0-938c-7015fbb5741b',1,'http://bpmn.io/schema/bpmn','Ticket Correction Workflow','ticket-correction-process',2,'8471324f-ea8b-11f0-938c-7015fbb5741b','C:\\Users\\Laptop-ALSACI\\Documents\\Projet Dev\\bank-data-quality-monitor-v13_bis\\backend-java\\target\\classes\\bpmn\\ticket-workflow.bpmn',NULL,0,1,NULL,NULL,180,1),('ticket-correction-process:3:1c5723b0-eab8-11f0-8c59-7015fbb5741b',1,'http://bpmn.io/schema/bpmn','Ticket Correction Workflow','ticket-correction-process',3,'1c3543ce-eab8-11f0-8c59-7015fbb5741b','C:\\Users\\Laptop-ALSACI\\Documents\\Projet Dev\\bank-data-quality-monitor-v13_new\\backend-java\\target\\classes\\bpmn\\ticket-workflow.bpmn',NULL,0,1,NULL,NULL,180,1),('ticket-correction-process:4:1c043496-eb6f-11f0-ac3e-7015fbb5741b',1,'http://bpmn.io/schema/bpmn','Ticket Correction Workflow','ticket-correction-process',4,'1bcde254-eb6f-11f0-ac3e-7015fbb5741b','C:\\Users\\Laptop-ALSACI\\Documents\\Projet Dev\\bank-data-quality-monitor-v16\\backend-java\\target\\classes\\bpmn\\ticket-workflow.bpmn',NULL,0,1,NULL,NULL,180,1);
/*!40000 ALTER TABLE `act_re_procdef` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_ru_authorization`
--

DROP TABLE IF EXISTS `act_ru_authorization`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_ru_authorization` (
  `ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `REV_` int NOT NULL,
  `TYPE_` int NOT NULL,
  `GROUP_ID_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `USER_ID_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `RESOURCE_TYPE_` int NOT NULL,
  `RESOURCE_ID_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `PERMS_` int DEFAULT NULL,
  `REMOVAL_TIME_` datetime DEFAULT NULL,
  `ROOT_PROC_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  PRIMARY KEY (`ID_`),
  UNIQUE KEY `ACT_UNIQ_AUTH_USER` (`USER_ID_`,`TYPE_`,`RESOURCE_TYPE_`,`RESOURCE_ID_`),
  UNIQUE KEY `ACT_UNIQ_AUTH_GROUP` (`GROUP_ID_`,`TYPE_`,`RESOURCE_TYPE_`,`RESOURCE_ID_`),
  KEY `ACT_IDX_AUTH_GROUP_ID` (`GROUP_ID_`),
  KEY `ACT_IDX_AUTH_RESOURCE_ID` (`RESOURCE_ID_`),
  KEY `ACT_IDX_AUTH_ROOT_PI` (`ROOT_PROC_INST_ID_`),
  KEY `ACT_IDX_AUTH_RM_TIME` (`REMOVAL_TIME_`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_ru_authorization`
--

LOCK TABLES `act_ru_authorization` WRITE;
/*!40000 ALTER TABLE `act_ru_authorization` DISABLE KEYS */;
INSERT INTO `act_ru_authorization` VALUES ('465551f4-e9e3-11f0-9763-7015fbb5741b',1,1,'camunda-admin',NULL,0,'*',2147483647,NULL,NULL),('4656d895-e9e3-11f0-9763-7015fbb5741b',1,1,'camunda-admin',NULL,1,'*',2147483647,NULL,NULL),('46579be6-e9e3-11f0-9763-7015fbb5741b',1,1,'camunda-admin',NULL,2,'*',2147483647,NULL,NULL),('46585f37-e9e3-11f0-9763-7015fbb5741b',1,1,'camunda-admin',NULL,3,'*',2147483647,NULL,NULL),('46592288-e9e3-11f0-9763-7015fbb5741b',1,1,'camunda-admin',NULL,4,'*',2147483647,NULL,NULL),('4659e5d9-e9e3-11f0-9763-7015fbb5741b',1,1,'camunda-admin',NULL,5,'*',2147483647,NULL,NULL),('465aa92a-e9e3-11f0-9763-7015fbb5741b',1,1,'camunda-admin',NULL,6,'*',2147483647,NULL,NULL),('465b938b-e9e3-11f0-9763-7015fbb5741b',1,1,'camunda-admin',NULL,7,'*',2147483647,NULL,NULL),('465c56dc-e9e3-11f0-9763-7015fbb5741b',1,1,'camunda-admin',NULL,8,'*',2147483647,NULL,NULL),('465d1a2d-e9e3-11f0-9763-7015fbb5741b',1,1,'camunda-admin',NULL,9,'*',2147483647,NULL,NULL),('465db66e-e9e3-11f0-9763-7015fbb5741b',1,1,'camunda-admin',NULL,10,'*',2147483647,NULL,NULL),('465e79bf-e9e3-11f0-9763-7015fbb5741b',1,1,'camunda-admin',NULL,11,'*',2147483647,NULL,NULL),('465f3d10-e9e3-11f0-9763-7015fbb5741b',1,1,'camunda-admin',NULL,12,'*',2147483647,NULL,NULL),('465fd951-e9e3-11f0-9763-7015fbb5741b',1,1,'camunda-admin',NULL,13,'*',2147483647,NULL,NULL),('46609ca2-e9e3-11f0-9763-7015fbb5741b',1,1,'camunda-admin',NULL,14,'*',2147483647,NULL,NULL),('46618703-e9e3-11f0-9763-7015fbb5741b',1,1,'camunda-admin',NULL,15,'*',2147483647,NULL,NULL),('46627164-e9e3-11f0-9763-7015fbb5741b',1,1,'camunda-admin',NULL,16,'*',2147483647,NULL,NULL),('46630da5-e9e3-11f0-9763-7015fbb5741b',1,1,'camunda-admin',NULL,17,'*',2147483647,NULL,NULL),('4663a9e6-e9e3-11f0-9763-7015fbb5741b',1,1,'camunda-admin',NULL,18,'*',2147483647,NULL,NULL),('46646d37-e9e3-11f0-9763-7015fbb5741b',1,1,'camunda-admin',NULL,19,'*',2147483647,NULL,NULL),('46650978-e9e3-11f0-9763-7015fbb5741b',1,1,'camunda-admin',NULL,20,'*',2147483647,NULL,NULL),('4665ccc9-e9e3-11f0-9763-7015fbb5741b',1,1,'camunda-admin',NULL,21,'*',2147483647,NULL,NULL);
/*!40000 ALTER TABLE `act_ru_authorization` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_ru_batch`
--

DROP TABLE IF EXISTS `act_ru_batch`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_ru_batch` (
  `ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `REV_` int NOT NULL,
  `TYPE_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `TOTAL_JOBS_` int DEFAULT NULL,
  `JOBS_CREATED_` int DEFAULT NULL,
  `JOBS_PER_SEED_` int DEFAULT NULL,
  `INVOCATIONS_PER_JOB_` int DEFAULT NULL,
  `SEED_JOB_DEF_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `BATCH_JOB_DEF_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `MONITOR_JOB_DEF_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `SUSPENSION_STATE_` int DEFAULT NULL,
  `CONFIGURATION_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `TENANT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `CREATE_USER_ID_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `START_TIME_` datetime DEFAULT NULL,
  `EXEC_START_TIME_` datetime DEFAULT NULL,
  PRIMARY KEY (`ID_`),
  KEY `ACT_IDX_BATCH_SEED_JOB_DEF` (`SEED_JOB_DEF_ID_`),
  KEY `ACT_IDX_BATCH_MONITOR_JOB_DEF` (`MONITOR_JOB_DEF_ID_`),
  KEY `ACT_IDX_BATCH_JOB_DEF` (`BATCH_JOB_DEF_ID_`),
  CONSTRAINT `ACT_FK_BATCH_JOB_DEF` FOREIGN KEY (`BATCH_JOB_DEF_ID_`) REFERENCES `act_ru_jobdef` (`ID_`),
  CONSTRAINT `ACT_FK_BATCH_MONITOR_JOB_DEF` FOREIGN KEY (`MONITOR_JOB_DEF_ID_`) REFERENCES `act_ru_jobdef` (`ID_`),
  CONSTRAINT `ACT_FK_BATCH_SEED_JOB_DEF` FOREIGN KEY (`SEED_JOB_DEF_ID_`) REFERENCES `act_ru_jobdef` (`ID_`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_ru_batch`
--

LOCK TABLES `act_ru_batch` WRITE;
/*!40000 ALTER TABLE `act_ru_batch` DISABLE KEYS */;
/*!40000 ALTER TABLE `act_ru_batch` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_ru_case_execution`
--

DROP TABLE IF EXISTS `act_ru_case_execution`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_ru_case_execution` (
  `ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `REV_` int DEFAULT NULL,
  `CASE_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `SUPER_CASE_EXEC_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `SUPER_EXEC_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `BUSINESS_KEY_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `PARENT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `CASE_DEF_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `ACT_ID_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `PREV_STATE_` int DEFAULT NULL,
  `CURRENT_STATE_` int DEFAULT NULL,
  `REQUIRED_` tinyint(1) DEFAULT NULL,
  `TENANT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  PRIMARY KEY (`ID_`),
  KEY `ACT_IDX_CASE_EXEC_BUSKEY` (`BUSINESS_KEY_`),
  KEY `ACT_IDX_CASE_EXE_CASE_INST` (`CASE_INST_ID_`),
  KEY `ACT_FK_CASE_EXE_PARENT` (`PARENT_ID_`),
  KEY `ACT_FK_CASE_EXE_CASE_DEF` (`CASE_DEF_ID_`),
  KEY `ACT_IDX_CASE_EXEC_TENANT_ID` (`TENANT_ID_`),
  CONSTRAINT `ACT_FK_CASE_EXE_CASE_DEF` FOREIGN KEY (`CASE_DEF_ID_`) REFERENCES `act_re_case_def` (`ID_`),
  CONSTRAINT `ACT_FK_CASE_EXE_CASE_INST` FOREIGN KEY (`CASE_INST_ID_`) REFERENCES `act_ru_case_execution` (`ID_`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ACT_FK_CASE_EXE_PARENT` FOREIGN KEY (`PARENT_ID_`) REFERENCES `act_ru_case_execution` (`ID_`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_ru_case_execution`
--

LOCK TABLES `act_ru_case_execution` WRITE;
/*!40000 ALTER TABLE `act_ru_case_execution` DISABLE KEYS */;
/*!40000 ALTER TABLE `act_ru_case_execution` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_ru_case_sentry_part`
--

DROP TABLE IF EXISTS `act_ru_case_sentry_part`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_ru_case_sentry_part` (
  `ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `REV_` int DEFAULT NULL,
  `CASE_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `CASE_EXEC_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `SENTRY_ID_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `TYPE_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `SOURCE_CASE_EXEC_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `STANDARD_EVENT_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `SOURCE_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `VARIABLE_EVENT_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `VARIABLE_NAME_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `SATISFIED_` tinyint(1) DEFAULT NULL,
  `TENANT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  PRIMARY KEY (`ID_`),
  KEY `ACT_FK_CASE_SENTRY_CASE_INST` (`CASE_INST_ID_`),
  KEY `ACT_FK_CASE_SENTRY_CASE_EXEC` (`CASE_EXEC_ID_`),
  CONSTRAINT `ACT_FK_CASE_SENTRY_CASE_EXEC` FOREIGN KEY (`CASE_EXEC_ID_`) REFERENCES `act_ru_case_execution` (`ID_`),
  CONSTRAINT `ACT_FK_CASE_SENTRY_CASE_INST` FOREIGN KEY (`CASE_INST_ID_`) REFERENCES `act_ru_case_execution` (`ID_`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_ru_case_sentry_part`
--

LOCK TABLES `act_ru_case_sentry_part` WRITE;
/*!40000 ALTER TABLE `act_ru_case_sentry_part` DISABLE KEYS */;
/*!40000 ALTER TABLE `act_ru_case_sentry_part` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_ru_event_subscr`
--

DROP TABLE IF EXISTS `act_ru_event_subscr`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_ru_event_subscr` (
  `ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `REV_` int DEFAULT NULL,
  `EVENT_TYPE_` varchar(255) COLLATE utf8mb3_bin NOT NULL,
  `EVENT_NAME_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `EXECUTION_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `PROC_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `ACTIVITY_ID_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `CONFIGURATION_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `CREATED_` datetime NOT NULL,
  `TENANT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  PRIMARY KEY (`ID_`),
  KEY `ACT_IDX_EVENT_SUBSCR_CONFIG_` (`CONFIGURATION_`),
  KEY `ACT_IDX_EVENT_SUBSCR_TENANT_ID` (`TENANT_ID_`),
  KEY `ACT_FK_EVENT_EXEC` (`EXECUTION_ID_`),
  KEY `ACT_IDX_EVENT_SUBSCR_EVT_NAME` (`EVENT_NAME_`),
  CONSTRAINT `ACT_FK_EVENT_EXEC` FOREIGN KEY (`EXECUTION_ID_`) REFERENCES `act_ru_execution` (`ID_`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_ru_event_subscr`
--

LOCK TABLES `act_ru_event_subscr` WRITE;
/*!40000 ALTER TABLE `act_ru_event_subscr` DISABLE KEYS */;
/*!40000 ALTER TABLE `act_ru_event_subscr` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_ru_execution`
--

DROP TABLE IF EXISTS `act_ru_execution`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_ru_execution` (
  `ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `REV_` int DEFAULT NULL,
  `ROOT_PROC_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `PROC_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `BUSINESS_KEY_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `PARENT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `PROC_DEF_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `SUPER_EXEC_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `SUPER_CASE_EXEC_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `CASE_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `ACT_ID_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `ACT_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `IS_ACTIVE_` tinyint DEFAULT NULL,
  `IS_CONCURRENT_` tinyint DEFAULT NULL,
  `IS_SCOPE_` tinyint DEFAULT NULL,
  `IS_EVENT_SCOPE_` tinyint DEFAULT NULL,
  `SUSPENSION_STATE_` int DEFAULT NULL,
  `CACHED_ENT_STATE_` int DEFAULT NULL,
  `SEQUENCE_COUNTER_` bigint DEFAULT NULL,
  `TENANT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  PRIMARY KEY (`ID_`),
  KEY `ACT_IDX_EXEC_ROOT_PI` (`ROOT_PROC_INST_ID_`),
  KEY `ACT_IDX_EXEC_BUSKEY` (`BUSINESS_KEY_`),
  KEY `ACT_IDX_EXEC_TENANT_ID` (`TENANT_ID_`),
  KEY `ACT_FK_EXE_PROCINST` (`PROC_INST_ID_`),
  KEY `ACT_FK_EXE_PARENT` (`PARENT_ID_`),
  KEY `ACT_FK_EXE_SUPER` (`SUPER_EXEC_`),
  KEY `ACT_FK_EXE_PROCDEF` (`PROC_DEF_ID_`),
  CONSTRAINT `ACT_FK_EXE_PARENT` FOREIGN KEY (`PARENT_ID_`) REFERENCES `act_ru_execution` (`ID_`),
  CONSTRAINT `ACT_FK_EXE_PROCDEF` FOREIGN KEY (`PROC_DEF_ID_`) REFERENCES `act_re_procdef` (`ID_`),
  CONSTRAINT `ACT_FK_EXE_PROCINST` FOREIGN KEY (`PROC_INST_ID_`) REFERENCES `act_ru_execution` (`ID_`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ACT_FK_EXE_SUPER` FOREIGN KEY (`SUPER_EXEC_`) REFERENCES `act_ru_execution` (`ID_`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_ru_execution`
--

LOCK TABLES `act_ru_execution` WRITE;
/*!40000 ALTER TABLE `act_ru_execution` DISABLE KEYS */;
/*!40000 ALTER TABLE `act_ru_execution` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_ru_ext_task`
--

DROP TABLE IF EXISTS `act_ru_ext_task`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_ru_ext_task` (
  `ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `REV_` int NOT NULL,
  `WORKER_ID_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `TOPIC_NAME_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `RETRIES_` int DEFAULT NULL,
  `ERROR_MSG_` varchar(4000) COLLATE utf8mb3_bin DEFAULT NULL,
  `ERROR_DETAILS_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `LOCK_EXP_TIME_` datetime DEFAULT NULL,
  `SUSPENSION_STATE_` int DEFAULT NULL,
  `EXECUTION_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `PROC_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `PROC_DEF_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `PROC_DEF_KEY_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `ACT_ID_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `ACT_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `TENANT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `PRIORITY_` bigint NOT NULL DEFAULT '0',
  `LAST_FAILURE_LOG_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  PRIMARY KEY (`ID_`),
  KEY `ACT_IDX_EXT_TASK_TOPIC` (`TOPIC_NAME_`),
  KEY `ACT_IDX_EXT_TASK_TENANT_ID` (`TENANT_ID_`),
  KEY `ACT_IDX_EXT_TASK_PRIORITY` (`PRIORITY_`),
  KEY `ACT_IDX_EXT_TASK_ERR_DETAILS` (`ERROR_DETAILS_ID_`),
  KEY `ACT_IDX_EXT_TASK_EXEC` (`EXECUTION_ID_`),
  CONSTRAINT `ACT_FK_EXT_TASK_ERROR_DETAILS` FOREIGN KEY (`ERROR_DETAILS_ID_`) REFERENCES `act_ge_bytearray` (`ID_`),
  CONSTRAINT `ACT_FK_EXT_TASK_EXE` FOREIGN KEY (`EXECUTION_ID_`) REFERENCES `act_ru_execution` (`ID_`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_ru_ext_task`
--

LOCK TABLES `act_ru_ext_task` WRITE;
/*!40000 ALTER TABLE `act_ru_ext_task` DISABLE KEYS */;
/*!40000 ALTER TABLE `act_ru_ext_task` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_ru_filter`
--

DROP TABLE IF EXISTS `act_ru_filter`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_ru_filter` (
  `ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `REV_` int NOT NULL,
  `RESOURCE_TYPE_` varchar(255) COLLATE utf8mb3_bin NOT NULL,
  `NAME_` varchar(255) COLLATE utf8mb3_bin NOT NULL,
  `OWNER_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `QUERY_` longtext COLLATE utf8mb3_bin NOT NULL,
  `PROPERTIES_` longtext COLLATE utf8mb3_bin,
  PRIMARY KEY (`ID_`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_ru_filter`
--

LOCK TABLES `act_ru_filter` WRITE;
/*!40000 ALTER TABLE `act_ru_filter` DISABLE KEYS */;
INSERT INTO `act_ru_filter` VALUES ('466c5c7b-e9e3-11f0-9763-7015fbb5741b',1,'Task','All tasks',NULL,'{}','{}');
/*!40000 ALTER TABLE `act_ru_filter` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_ru_identitylink`
--

DROP TABLE IF EXISTS `act_ru_identitylink`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_ru_identitylink` (
  `ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `REV_` int DEFAULT NULL,
  `GROUP_ID_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `TYPE_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `USER_ID_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `TASK_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `PROC_DEF_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `TENANT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  PRIMARY KEY (`ID_`),
  KEY `ACT_IDX_IDENT_LNK_USER` (`USER_ID_`),
  KEY `ACT_IDX_IDENT_LNK_GROUP` (`GROUP_ID_`),
  KEY `ACT_IDX_ATHRZ_PROCEDEF` (`PROC_DEF_ID_`),
  KEY `ACT_FK_TSKASS_TASK` (`TASK_ID_`),
  CONSTRAINT `ACT_FK_ATHRZ_PROCEDEF` FOREIGN KEY (`PROC_DEF_ID_`) REFERENCES `act_re_procdef` (`ID_`),
  CONSTRAINT `ACT_FK_TSKASS_TASK` FOREIGN KEY (`TASK_ID_`) REFERENCES `act_ru_task` (`ID_`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_ru_identitylink`
--

LOCK TABLES `act_ru_identitylink` WRITE;
/*!40000 ALTER TABLE `act_ru_identitylink` DISABLE KEYS */;
/*!40000 ALTER TABLE `act_ru_identitylink` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_ru_incident`
--

DROP TABLE IF EXISTS `act_ru_incident`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_ru_incident` (
  `ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `REV_` int NOT NULL,
  `INCIDENT_TIMESTAMP_` datetime NOT NULL,
  `INCIDENT_MSG_` varchar(4000) COLLATE utf8mb3_bin DEFAULT NULL,
  `INCIDENT_TYPE_` varchar(255) COLLATE utf8mb3_bin NOT NULL,
  `EXECUTION_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `ACTIVITY_ID_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `FAILED_ACTIVITY_ID_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `PROC_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `PROC_DEF_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `CAUSE_INCIDENT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `ROOT_CAUSE_INCIDENT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `CONFIGURATION_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `TENANT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `JOB_DEF_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `ANNOTATION_` varchar(4000) COLLATE utf8mb3_bin DEFAULT NULL,
  PRIMARY KEY (`ID_`),
  KEY `ACT_IDX_INC_CONFIGURATION` (`CONFIGURATION_`),
  KEY `ACT_IDX_INC_TENANT_ID` (`TENANT_ID_`),
  KEY `ACT_IDX_INC_JOB_DEF` (`JOB_DEF_ID_`),
  KEY `ACT_IDX_INC_CAUSEINCID` (`CAUSE_INCIDENT_ID_`),
  KEY `ACT_IDX_INC_EXID` (`EXECUTION_ID_`),
  KEY `ACT_IDX_INC_PROCDEFID` (`PROC_DEF_ID_`),
  KEY `ACT_IDX_INC_PROCINSTID` (`PROC_INST_ID_`),
  KEY `ACT_IDX_INC_ROOTCAUSEINCID` (`ROOT_CAUSE_INCIDENT_ID_`),
  CONSTRAINT `ACT_FK_INC_CAUSE` FOREIGN KEY (`CAUSE_INCIDENT_ID_`) REFERENCES `act_ru_incident` (`ID_`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ACT_FK_INC_EXE` FOREIGN KEY (`EXECUTION_ID_`) REFERENCES `act_ru_execution` (`ID_`),
  CONSTRAINT `ACT_FK_INC_JOB_DEF` FOREIGN KEY (`JOB_DEF_ID_`) REFERENCES `act_ru_jobdef` (`ID_`),
  CONSTRAINT `ACT_FK_INC_PROCDEF` FOREIGN KEY (`PROC_DEF_ID_`) REFERENCES `act_re_procdef` (`ID_`),
  CONSTRAINT `ACT_FK_INC_PROCINST` FOREIGN KEY (`PROC_INST_ID_`) REFERENCES `act_ru_execution` (`ID_`),
  CONSTRAINT `ACT_FK_INC_RCAUSE` FOREIGN KEY (`ROOT_CAUSE_INCIDENT_ID_`) REFERENCES `act_ru_incident` (`ID_`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_ru_incident`
--

LOCK TABLES `act_ru_incident` WRITE;
/*!40000 ALTER TABLE `act_ru_incident` DISABLE KEYS */;
/*!40000 ALTER TABLE `act_ru_incident` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_ru_job`
--

DROP TABLE IF EXISTS `act_ru_job`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_ru_job` (
  `ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `REV_` int DEFAULT NULL,
  `TYPE_` varchar(255) COLLATE utf8mb3_bin NOT NULL,
  `LOCK_EXP_TIME_` datetime DEFAULT NULL,
  `LOCK_OWNER_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `EXCLUSIVE_` tinyint(1) DEFAULT NULL,
  `EXECUTION_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `PROCESS_INSTANCE_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `PROCESS_DEF_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `PROCESS_DEF_KEY_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `RETRIES_` int DEFAULT NULL,
  `EXCEPTION_STACK_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `EXCEPTION_MSG_` varchar(4000) COLLATE utf8mb3_bin DEFAULT NULL,
  `FAILED_ACT_ID_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `DUEDATE_` datetime DEFAULT NULL,
  `REPEAT_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `REPEAT_OFFSET_` bigint DEFAULT '0',
  `HANDLER_TYPE_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `HANDLER_CFG_` varchar(4000) COLLATE utf8mb3_bin DEFAULT NULL,
  `DEPLOYMENT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `SUSPENSION_STATE_` int NOT NULL DEFAULT '1',
  `JOB_DEF_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `PRIORITY_` bigint NOT NULL DEFAULT '0',
  `SEQUENCE_COUNTER_` bigint DEFAULT NULL,
  `TENANT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `CREATE_TIME_` datetime DEFAULT NULL,
  `LAST_FAILURE_LOG_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  PRIMARY KEY (`ID_`),
  KEY `ACT_IDX_JOB_EXECUTION_ID` (`EXECUTION_ID_`),
  KEY `ACT_IDX_JOB_HANDLER` (`HANDLER_TYPE_`(100),`HANDLER_CFG_`(155)),
  KEY `ACT_IDX_JOB_PROCINST` (`PROCESS_INSTANCE_ID_`),
  KEY `ACT_IDX_JOB_TENANT_ID` (`TENANT_ID_`),
  KEY `ACT_IDX_JOB_JOB_DEF_ID` (`JOB_DEF_ID_`),
  KEY `ACT_FK_JOB_EXCEPTION` (`EXCEPTION_STACK_ID_`),
  KEY `ACT_IDX_JOB_HANDLER_TYPE` (`HANDLER_TYPE_`),
  CONSTRAINT `ACT_FK_JOB_EXCEPTION` FOREIGN KEY (`EXCEPTION_STACK_ID_`) REFERENCES `act_ge_bytearray` (`ID_`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_ru_job`
--

LOCK TABLES `act_ru_job` WRITE;
/*!40000 ALTER TABLE `act_ru_job` DISABLE KEYS */;
/*!40000 ALTER TABLE `act_ru_job` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_ru_jobdef`
--

DROP TABLE IF EXISTS `act_ru_jobdef`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_ru_jobdef` (
  `ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `REV_` int DEFAULT NULL,
  `PROC_DEF_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `PROC_DEF_KEY_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `ACT_ID_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `JOB_TYPE_` varchar(255) COLLATE utf8mb3_bin NOT NULL,
  `JOB_CONFIGURATION_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `SUSPENSION_STATE_` int DEFAULT NULL,
  `JOB_PRIORITY_` bigint DEFAULT NULL,
  `TENANT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `DEPLOYMENT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  PRIMARY KEY (`ID_`),
  KEY `ACT_IDX_JOBDEF_TENANT_ID` (`TENANT_ID_`),
  KEY `ACT_IDX_JOBDEF_PROC_DEF_ID` (`PROC_DEF_ID_`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_ru_jobdef`
--

LOCK TABLES `act_ru_jobdef` WRITE;
/*!40000 ALTER TABLE `act_ru_jobdef` DISABLE KEYS */;
/*!40000 ALTER TABLE `act_ru_jobdef` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_ru_meter_log`
--

DROP TABLE IF EXISTS `act_ru_meter_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_ru_meter_log` (
  `ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `NAME_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `REPORTER_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `VALUE_` bigint DEFAULT NULL,
  `TIMESTAMP_` datetime DEFAULT NULL,
  `MILLISECONDS_` bigint DEFAULT '0',
  PRIMARY KEY (`ID_`),
  KEY `ACT_IDX_METER_LOG_MS` (`MILLISECONDS_`),
  KEY `ACT_IDX_METER_LOG_NAME_MS` (`NAME_`,`MILLISECONDS_`),
  KEY `ACT_IDX_METER_LOG_REPORT` (`NAME_`,`REPORTER_`,`MILLISECONDS_`),
  KEY `ACT_IDX_METER_LOG_TIME` (`TIMESTAMP_`),
  KEY `ACT_IDX_METER_LOG` (`NAME_`,`TIMESTAMP_`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_ru_meter_log`
--

LOCK TABLES `act_ru_meter_log` WRITE;
/*!40000 ALTER TABLE `act_ru_meter_log` DISABLE KEYS */;
INSERT INTO `act_ru_meter_log` VALUES ('030eaae8-e9e9-11f0-aec6-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-05 03:45:44',1767584743640),('030eaae9-e9e9-11f0-aec6-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-05 03:45:44',1767584743640),('030eaaea-e9e9-11f0-aec6-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-05 03:45:44',1767584743640),('030eaaeb-e9e9-11f0-aec6-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-05 03:45:44',1767584743640),('030ed1fc-e9e9-11f0-aec6-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-05 03:45:44',1767584743640),('030ed1fd-e9e9-11f0-aec6-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-05 03:45:44',1767584743640),('030ed1fe-e9e9-11f0-aec6-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-05 03:45:44',1767584743640),('030ed1ff-e9e9-11f0-aec6-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-05 03:45:44',1767584743640),('030ed200-e9e9-11f0-aec6-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-05 03:45:44',1767584743640),('030ed201-e9e9-11f0-aec6-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',18,'2026-01-05 03:45:44',1767584743640),('030ed202-e9e9-11f0-aec6-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-05 03:45:44',1767584743640),('030ed203-e9e9-11f0-aec6-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-05 03:45:44',1767584743640),('061ec6ea-eaf6-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283399),('061ec6eb-eaf6-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283399),('061ec6ec-eaf6-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283399),('061ec6ed-eaf6-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283399),('061ec6ee-eaf6-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283399),('061ec6ef-eaf6-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283399),('061ec6f0-eaf6-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283399),('061ec6f1-eaf6-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283399),('061ec6f2-eaf6-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283399),('061ec6f3-eaf6-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',18,'2026-01-06 11:51:23',1767700283399),('061ec6f4-eaf6-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283399),('061ec6f5-eaf6-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283399),('0623a8f6-eaf6-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283432),('0623a8f7-eaf6-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283432),('0623a8f8-eaf6-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283432),('0623a8f9-eaf6-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283432),('0623a8fa-eaf6-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283432),('0623a8fb-eaf6-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283432),('0623a8fc-eaf6-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283432),('0623a8fd-eaf6-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283432),('0623a8fe-eaf6-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283432),('0623a8ff-eaf6-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283432),('0623a900-eaf6-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283432),('0623a901-eaf6-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283432),('0625f2f2-eaf6-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283447),('0625f2f3-eaf6-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283447),('0625f2f4-eaf6-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283447),('0625f2f5-eaf6-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283447),('0625f2f6-eaf6-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283447),('0625f2f7-eaf6-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283447),('0625f2f8-eaf6-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283447),('0625f2f9-eaf6-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283447),('0625f2fa-eaf6-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283447),('0625f2fb-eaf6-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283447),('0625f2fc-eaf6-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283447),('0625f2fd-eaf6-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283447),('06288b0e-eaf6-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283466),('06288b0f-eaf6-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283466),('06288b10-eaf6-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283466),('06288b11-eaf6-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283466),('06288b12-eaf6-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283466),('06288b13-eaf6-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283466),('06288b14-eaf6-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283466),('06288b15-eaf6-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283466),('06288b16-eaf6-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283466),('06288b17-eaf6-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283466),('06288b18-eaf6-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283466),('06288b19-eaf6-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283466),('062afc1a-eaf6-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283482),('062afc1b-eaf6-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283482),('062afc1c-eaf6-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283482),('062afc1d-eaf6-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283482),('062afc1e-eaf6-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283482),('062afc1f-eaf6-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283482),('062afc20-eaf6-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283482),('062afc21-eaf6-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283482),('062afc22-eaf6-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283482),('062afc23-eaf6-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283482),('062afc24-eaf6-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283482),('062afc25-eaf6-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283482),('062d6d26-eaf6-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283495),('062d6d27-eaf6-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283495),('062d6d28-eaf6-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283495),('062d6d29-eaf6-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283495),('062d6d2a-eaf6-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283495),('062d6d2b-eaf6-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283495),('062d6d2c-eaf6-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283495),('062d6d2d-eaf6-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283495),('062d6d2e-eaf6-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283495),('062d6d2f-eaf6-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283495),('062d6d30-eaf6-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283495),('062d6d31-eaf6-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 11:51:23',1767700283495),('062ea5b2-eaf6-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283506),('062ea5b3-eaf6-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283506),('062ea5b4-eaf6-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283506),('062ea5b5-eaf6-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283506),('062ea5b6-eaf6-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283506),('062ea5b7-eaf6-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283506),('062ea5b8-eaf6-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283506),('062ea5b9-eaf6-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283506),('062ea5ba-eaf6-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283506),('062ea5bb-eaf6-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283506),('062ea5bc-eaf6-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283506),('062ea5bd-eaf6-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283506),('062f41fe-eaf6-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283510),('062f41ff-eaf6-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283510),('062f4200-eaf6-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283510),('062f4201-eaf6-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283510),('062f4202-eaf6-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283510),('062f4203-eaf6-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283510),('062f4204-eaf6-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283510),('062f4205-eaf6-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283510),('062f4206-eaf6-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283510),('062f4207-eaf6-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283510),('062f4208-eaf6-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283510),('062f4209-eaf6-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283510),('0633129a-eaf6-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283535),('0633129b-eaf6-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283535),('0633129c-eaf6-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283535),('0633129d-eaf6-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283535),('0633129e-eaf6-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283535),('0633129f-eaf6-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283535),('063312a0-eaf6-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283535),('063312a1-eaf6-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283535),('063312a2-eaf6-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283535),('063312a3-eaf6-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283535),('063312a4-eaf6-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283535),('063312a5-eaf6-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283535),('06350e76-eaf6-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283548),('06350e77-eaf6-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283548),('06350e78-eaf6-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283548),('06350e79-eaf6-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283548),('06350e7a-eaf6-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283548),('06350e7b-eaf6-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283548),('06350e7c-eaf6-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283548),('06350e7d-eaf6-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283548),('06350e7e-eaf6-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283548),('06350e7f-eaf6-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283548),('06350e80-eaf6-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283548),('06350e81-eaf6-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283548),('06370a52-eaf6-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283561),('06370a53-eaf6-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283561),('06370a54-eaf6-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283561),('06370a55-eaf6-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283561),('06370a56-eaf6-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283561),('06370a57-eaf6-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283561),('06370a58-eaf6-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283561),('06370a59-eaf6-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283561),('06370a5a-eaf6-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283561),('06370a5b-eaf6-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283561),('06370a5c-eaf6-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283561),('06370a5d-eaf6-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283561),('06392d3e-eaf6-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283573),('06392d3f-eaf6-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283573),('06392d40-eaf6-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283573),('06392d41-eaf6-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283573),('06392d42-eaf6-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283573),('06392d43-eaf6-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283573),('06392d44-eaf6-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283573),('06392d45-eaf6-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283573),('06392d46-eaf6-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283573),('06392d47-eaf6-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283573),('06392d48-eaf6-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283573),('06392d49-eaf6-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283573),('063a8cda-eaf6-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283584),('063a8cdb-eaf6-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283584),('063a8cdc-eaf6-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283584),('063a8cdd-eaf6-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283584),('063a8cde-eaf6-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283584),('063a8cdf-eaf6-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283584),('063a8ce0-eaf6-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283584),('063a8ce1-eaf6-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283584),('063a8ce2-eaf6-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283584),('063a8ce3-eaf6-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283584),('063a8ce4-eaf6-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283584),('063a8ce5-eaf6-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283584),('063bec76-eaf6-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283593),('063bec77-eaf6-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283593),('063bec78-eaf6-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283593),('063bec79-eaf6-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283593),('063bec7a-eaf6-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283593),('063bec7b-eaf6-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283593),('063bec7c-eaf6-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283593),('063bec7d-eaf6-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283593),('063bec7e-eaf6-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283593),('063bec7f-eaf6-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283593),('063bec80-eaf6-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283593),('063bec81-eaf6-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283593),('063d2502-eaf6-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283601),('063d2503-eaf6-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283601),('063d2504-eaf6-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283601),('063d2505-eaf6-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283601),('063d2506-eaf6-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283601),('063d2507-eaf6-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283601),('063d2508-eaf6-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283601),('063d2509-eaf6-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283601),('063d250a-eaf6-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283601),('063d250b-eaf6-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283601),('063d250c-eaf6-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283601),('063d250d-eaf6-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283601),('063f20de-eaf6-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283614),('063f20df-eaf6-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283614),('063f20e0-eaf6-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283614),('063f20e1-eaf6-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283614),('063f20e2-eaf6-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283614),('063f20e3-eaf6-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283614),('063f20e4-eaf6-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283614),('063f20e5-eaf6-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283614),('063f20e6-eaf6-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283614),('063f20e7-eaf6-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283614),('063f20e8-eaf6-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283614),('063f20e9-eaf6-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283614),('064190ea-eaf6-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283627),('064190eb-eaf6-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283627),('064190ec-eaf6-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283627),('064190ed-eaf6-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283627),('064190ee-eaf6-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283627),('064190ef-eaf6-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283627),('064190f0-eaf6-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283627),('064190f1-eaf6-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283627),('064190f2-eaf6-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283627),('064190f3-eaf6-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283627),('064190f4-eaf6-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283627),('064190f5-eaf6-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283627),('06431796-eaf6-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283640),('06431797-eaf6-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283640),('06431798-eaf6-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283640),('06431799-eaf6-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283640),('0643179a-eaf6-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283640),('0643179b-eaf6-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283640),('0643179c-eaf6-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283640),('0643179d-eaf6-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283640),('0643179e-eaf6-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283640),('0643179f-eaf6-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283640),('064317a0-eaf6-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283640),('064317a1-eaf6-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283640),('0643daf2-eaf6-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283645),('0643daf3-eaf6-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283645),('0643daf4-eaf6-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283645),('0643daf5-eaf6-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283645),('0643daf6-eaf6-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283645),('0643daf7-eaf6-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283645),('0643daf8-eaf6-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283645),('0643daf9-eaf6-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283645),('0643dafa-eaf6-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283645),('0643dafb-eaf6-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283645),('0643dafc-eaf6-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283645),('0643dafd-eaf6-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283645),('064588ae-eaf6-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283656),('064588af-eaf6-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283656),('064588b0-eaf6-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283656),('064588b1-eaf6-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283656),('064588b2-eaf6-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283656),('064588b3-eaf6-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283656),('064588b4-eaf6-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283656),('064588b5-eaf6-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283656),('064588b6-eaf6-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283656),('064588b7-eaf6-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283656),('064588b8-eaf6-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283656),('064588b9-eaf6-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283656),('06475d7a-eaf6-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283668),('06475d7b-eaf6-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283668),('06475d7c-eaf6-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283668),('06475d7d-eaf6-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283668),('06475d7e-eaf6-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283668),('06475d7f-eaf6-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283668),('06475d80-eaf6-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283668),('06475d81-eaf6-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283668),('06475d82-eaf6-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283668),('06475d83-eaf6-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283668),('06475d84-eaf6-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283668),('06475d85-eaf6-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283668),('06493246-eaf6-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283680),('06493247-eaf6-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283680),('06493248-eaf6-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283680),('06493249-eaf6-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283680),('0649324a-eaf6-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283680),('0649324b-eaf6-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283680),('0649324c-eaf6-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283680),('0649324d-eaf6-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283680),('0649324e-eaf6-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283680),('0649324f-eaf6-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283680),('06493250-eaf6-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283680),('06493251-eaf6-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283680),('064ae002-eaf6-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283691),('064ae003-eaf6-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283691),('064ae004-eaf6-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283691),('064ae005-eaf6-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283691),('064ae006-eaf6-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283691),('064ae007-eaf6-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283691),('064ae008-eaf6-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283691),('064ae009-eaf6-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283691),('064ae00a-eaf6-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283691),('064ae00b-eaf6-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283691),('064ae00c-eaf6-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283691),('064ae00d-eaf6-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283691),('064c3f9e-eaf6-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283700),('064c3f9f-eaf6-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283700),('064c3fa0-eaf6-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283700),('064c3fa1-eaf6-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283700),('064c3fa2-eaf6-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283700),('064c3fa3-eaf6-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283700),('064c3fa4-eaf6-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283700),('064c3fa5-eaf6-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283700),('064c3fa6-eaf6-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283700),('064c3fa7-eaf6-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283700),('064c3fa8-eaf6-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283700),('064c3fa9-eaf6-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283700),('064c3faa-eaf6-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283700),('064c3fab-eaf6-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283700),('064c3fac-eaf6-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283700),('064c3fad-eaf6-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283700),('064c3fae-eaf6-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283700),('064c3faf-eaf6-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283700),('064c3fb0-eaf6-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283700),('064c3fb1-eaf6-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283700),('064c3fb2-eaf6-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283700),('064c3fb3-eaf6-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283700),('064c3fb4-eaf6-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283700),('064c3fb5-eaf6-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283700),('064e89a6-eaf6-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283715),('064e89a7-eaf6-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283715),('064e89a8-eaf6-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283715),('064e89a9-eaf6-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283715),('064e89aa-eaf6-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283715),('064e89ab-eaf6-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283715),('064e89ac-eaf6-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283715),('064e89ad-eaf6-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283715),('064e89ae-eaf6-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283715),('064e89af-eaf6-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283715),('064e89b0-eaf6-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283715),('064e89b1-eaf6-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283715),('0650fab2-eaf6-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283731),('0650fab3-eaf6-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283731),('0650fab4-eaf6-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283731),('0650fab5-eaf6-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283731),('0650fab6-eaf6-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283731),('0650fab7-eaf6-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283731),('0650fab8-eaf6-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283731),('0650fab9-eaf6-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283731),('0650faba-eaf6-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283731),('0650fabb-eaf6-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283731),('0650fabc-eaf6-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283731),('0650fabd-eaf6-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283731),('0651e51e-eaf6-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283737),('0651e51f-eaf6-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283737),('0651e520-eaf6-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283737),('0651e521-eaf6-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283737),('0651e522-eaf6-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283737),('0651e523-eaf6-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283737),('0651e524-eaf6-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283737),('0651e525-eaf6-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283737),('0651e526-eaf6-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283737),('0651e527-eaf6-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283737),('0651e528-eaf6-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283737),('0651e529-eaf6-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 11:51:24',1767700283737),('0783ea9a-eaf8-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 12:05:45',1767701144736),('0783ea9b-eaf8-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 12:05:45',1767701144736),('0783ea9c-eaf8-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 12:05:45',1767701144736),('0783ea9d-eaf8-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 12:05:45',1767701144736),('0783ea9e-eaf8-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 12:05:45',1767701144736),('0783ea9f-eaf8-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 12:05:45',1767701144736),('0783eaa0-eaf8-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 12:05:45',1767701144736),('0783eaa1-eaf8-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 12:05:45',1767701144736),('0783eaa2-eaf8-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 12:05:45',1767701144736),('0783eaa3-eaf8-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',15,'2026-01-06 12:05:45',1767701144736),('0783eaa4-eaf8-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 12:05:45',1767701144736),('0783eaa5-eaf8-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 12:05:45',1767701144736),('08054262-ea9e-11f0-a59d-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 01:21:31',1767662490877),('08054263-ea9e-11f0-a59d-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 01:21:31',1767662490877),('08054264-ea9e-11f0-a59d-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 01:21:31',1767662490877),('08054265-ea9e-11f0-a59d-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 01:21:31',1767662490877),('08054266-ea9e-11f0-a59d-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 01:21:31',1767662490877),('08054267-ea9e-11f0-a59d-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 01:21:31',1767662490877),('08054268-ea9e-11f0-a59d-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 01:21:31',1767662490877),('08054269-ea9e-11f0-a59d-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 01:21:31',1767662490877),('0805426a-ea9e-11f0-a59d-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 01:21:31',1767662490877),('0805426b-ea9e-11f0-a59d-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',3,'2026-01-06 01:21:31',1767662490877),('0805426c-ea9e-11f0-a59d-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 01:21:31',1767662490877),('0805426d-ea9e-11f0-a59d-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 01:21:31',1767662490877),('09735682-eb50-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 22:35:44',1767738943694),('09735683-eb50-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 22:35:44',1767738943694),('09735684-eb50-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 22:35:44',1767738943694),('09735685-eb50-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 22:35:44',1767738943694),('09735686-eb50-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 22:35:44',1767738943694),('09735687-eb50-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 22:35:44',1767738943694),('09735688-eb50-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 22:35:44',1767738943694),('09735689-eb50-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 22:35:44',1767738943694),('0973568a-eb50-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 22:35:44',1767738943694),('0973568b-eb50-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',15,'2026-01-06 22:35:44',1767738943694),('0973568c-eb50-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 22:35:44',1767738943694),('0973568d-eb50-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 22:35:44',1767738943694),('0b9f1fd9-eaa0-11f0-87a5-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 01:35:56',1767663355912),('0b9f46ea-eaa0-11f0-87a5-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 01:35:56',1767663355912),('0b9f46eb-eaa0-11f0-87a5-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 01:35:56',1767663355912),('0b9f46ec-eaa0-11f0-87a5-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 01:35:56',1767663355912),('0b9f46ed-eaa0-11f0-87a5-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 01:35:56',1767663355912),('0b9f46ee-eaa0-11f0-87a5-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 01:35:56',1767663355912),('0b9f46ef-eaa0-11f0-87a5-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 01:35:56',1767663355912),('0b9f46f0-eaa0-11f0-87a5-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 01:35:56',1767663355912),('0b9f46f1-eaa0-11f0-87a5-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 01:35:56',1767663355912),('0b9f46f2-eaa0-11f0-87a5-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',15,'2026-01-06 01:35:56',1767663355912),('0b9f46f3-eaa0-11f0-87a5-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 01:35:56',1767663355912),('0b9f46f4-eaa0-11f0-87a5-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 01:35:56',1767663355912),('0f1670fe-ea99-11f0-aa29-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 00:45:55',1767660355248),('0f1670ff-ea99-11f0-aa29-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 00:45:55',1767660355248),('0f167100-ea99-11f0-aa29-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 00:45:55',1767660355248),('0f167101-ea99-11f0-aa29-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 00:45:55',1767660355248),('0f167102-ea99-11f0-aa29-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 00:45:55',1767660355248),('0f167103-ea99-11f0-aa29-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 00:45:55',1767660355248),('0f167104-ea99-11f0-aa29-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 00:45:55',1767660355248),('0f167105-ea99-11f0-aa29-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 00:45:55',1767660355248),('0f167106-ea99-11f0-aa29-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 00:45:55',1767660355248),('0f167107-ea99-11f0-aa29-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',2,'2026-01-06 00:45:55',1767660355248),('0f167108-ea99-11f0-aa29-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 00:45:55',1767660355248),('0f167109-ea99-11f0-aa29-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 00:45:55',1767660355248),('1bb681d9-eaae-11f0-a48e-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 03:16:36',1767669395862),('1bb681da-eaae-11f0-a48e-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 03:16:36',1767669395862),('1bb681db-eaae-11f0-a48e-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 03:16:36',1767669395862),('1bb681dc-eaae-11f0-a48e-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 03:16:36',1767669395862),('1bb681dd-eaae-11f0-a48e-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 03:16:36',1767669395862),('1bb681de-eaae-11f0-a48e-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 03:16:36',1767669395862),('1bb681df-eaae-11f0-a48e-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 03:16:36',1767669395862),('1bb681e0-eaae-11f0-a48e-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 03:16:36',1767669395862),('1bb681e1-eaae-11f0-a48e-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 03:16:36',1767669395862),('1bb681e2-eaae-11f0-a48e-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',10,'2026-01-06 03:16:36',1767669395862),('1bb681e3-eaae-11f0-a48e-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 03:16:36',1767669395862),('1bb681e4-eaae-11f0-a48e-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 03:16:36',1767669395862),('1e5963d3-e9e6-11f0-b01e-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-05 03:25:01',1767583500939),('1e5963d4-e9e6-11f0-b01e-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-05 03:25:01',1767583500939),('1e5963d5-e9e6-11f0-b01e-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-05 03:25:01',1767583500939),('1e5963d6-e9e6-11f0-b01e-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-05 03:25:01',1767583500939),('1e5963d7-e9e6-11f0-b01e-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-05 03:25:01',1767583500939),('1e5963d8-e9e6-11f0-b01e-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-05 03:25:01',1767583500939),('1e5963d9-e9e6-11f0-b01e-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-05 03:25:01',1767583500939),('1e5963da-e9e6-11f0-b01e-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-05 03:25:01',1767583500939),('1e5963db-e9e6-11f0-b01e-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-05 03:25:01',1767583500939),('1e5963dc-e9e6-11f0-b01e-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-05 03:25:01',1767583500939),('1e5963dd-e9e6-11f0-b01e-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-05 03:25:01',1767583500939),('1e5963de-e9e6-11f0-b01e-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-05 03:25:01',1767583500939),('25991168-eaaf-11f0-bb70-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 03:24:02',1767669841940),('25993879-eaaf-11f0-bb70-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 03:24:02',1767669841940),('2599387a-eaaf-11f0-bb70-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 03:24:02',1767669841940),('2599387b-eaaf-11f0-bb70-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 03:24:02',1767669841940),('2599387c-eaaf-11f0-bb70-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 03:24:02',1767669841940),('2599387d-eaaf-11f0-bb70-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 03:24:02',1767669841940),('2599387e-eaaf-11f0-bb70-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 03:24:02',1767669841940),('2599387f-eaaf-11f0-bb70-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 03:24:02',1767669841940),('25993880-eaaf-11f0-bb70-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 03:24:02',1767669841940),('25993881-eaaf-11f0-bb70-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',9,'2026-01-06 03:24:02',1767669841940),('25993882-eaaf-11f0-bb70-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 03:24:02',1767669841940),('25993883-eaaf-11f0-bb70-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 03:24:02',1767669841940),('265363ba-ea8e-11f0-9c26-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-05 23:27:50',1767655669770),('26538acb-ea8e-11f0-9c26-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-05 23:27:50',1767655669770),('26538acc-ea8e-11f0-9c26-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-05 23:27:50',1767655669770),('26538acd-ea8e-11f0-9c26-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-05 23:27:50',1767655669770),('26538ace-ea8e-11f0-9c26-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-05 23:27:50',1767655669770),('26538acf-ea8e-11f0-9c26-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-05 23:27:50',1767655669770),('26538ad0-ea8e-11f0-9c26-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-05 23:27:50',1767655669770),('26538ad1-ea8e-11f0-9c26-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-05 23:27:50',1767655669770),('26538ad2-ea8e-11f0-9c26-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-05 23:27:50',1767655669770),('26538ad3-ea8e-11f0-9c26-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-05 23:27:50',1767655669770),('26538ad4-ea8e-11f0-9c26-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-05 23:27:50',1767655669770),('26538ad5-ea8e-11f0-9c26-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-05 23:27:50',1767655669770),('2b8bc710-eabb-11f0-a596-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 04:50:06',1767675005881),('2b8bc711-eabb-11f0-a596-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 04:50:06',1767675005881),('2b8bc712-eabb-11f0-a596-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 04:50:06',1767675005881),('2b8bc713-eabb-11f0-a596-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 04:50:06',1767675005881),('2b8bc714-eabb-11f0-a596-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 04:50:06',1767675005881),('2b8bc715-eabb-11f0-a596-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 04:50:06',1767675005881),('2b8bc716-eabb-11f0-a596-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 04:50:06',1767675005881),('2b8bc717-eabb-11f0-a596-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 04:50:06',1767675005881),('2b8bc718-eabb-11f0-a596-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 04:50:06',1767675005881),('2b8bc719-eabb-11f0-a596-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',6,'2026-01-06 04:50:06',1767675005881),('2b8bc71a-eabb-11f0-a596-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 04:50:06',1767675005881),('2b8bc71b-eabb-11f0-a596-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 04:50:06',1767675005881),('35288e77-eb70-11f0-ac3e-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-07 02:26:01',1767752760917),('35288e78-eb70-11f0-ac3e-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-07 02:26:01',1767752760917),('3528b589-eb70-11f0-ac3e-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-07 02:26:01',1767752760917),('3528b58a-eb70-11f0-ac3e-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-07 02:26:01',1767752760917),('3528b58b-eb70-11f0-ac3e-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-07 02:26:01',1767752760917),('3528b58c-eb70-11f0-ac3e-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-07 02:26:01',1767752760917),('3528b58d-eb70-11f0-ac3e-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-07 02:26:01',1767752760917),('3528b58e-eb70-11f0-ac3e-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-07 02:26:01',1767752760917),('3528b58f-eb70-11f0-ac3e-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-07 02:26:01',1767752760917),('3528b590-eb70-11f0-ac3e-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',11,'2026-01-07 02:26:01',1767752760917),('3528b591-eb70-11f0-ac3e-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-07 02:26:01',1767752760917),('3528b592-eb70-11f0-ac3e-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-07 02:26:01',1767752760917),('3536ca68-eaa2-11f0-9dfd-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 01:51:25',1767664284683),('3536ca69-eaa2-11f0-9dfd-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 01:51:25',1767664284683),('3536ca6a-eaa2-11f0-9dfd-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 01:51:25',1767664284683),('3536ca6b-eaa2-11f0-9dfd-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 01:51:25',1767664284683),('3536ca6c-eaa2-11f0-9dfd-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 01:51:25',1767664284683),('3536ca6d-eaa2-11f0-9dfd-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 01:51:25',1767664284683),('3536ca6e-eaa2-11f0-9dfd-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 01:51:25',1767664284683),('3536ca6f-eaa2-11f0-9dfd-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 01:51:25',1767664284683),('3536ca70-eaa2-11f0-9dfd-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 01:51:25',1767664284683),('3536ca71-eaa2-11f0-9dfd-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',13,'2026-01-06 01:51:25',1767664284683),('3536ca72-eaa2-11f0-9dfd-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 01:51:25',1767664284683),('3536ca73-eaa2-11f0-9dfd-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 01:51:25',1767664284683),('3b9fc587-e9ee-11f0-84e6-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-05 04:23:06',1767586986026),('3b9fc588-e9ee-11f0-84e6-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-05 04:23:06',1767586986026),('3b9fc589-e9ee-11f0-84e6-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-05 04:23:06',1767586986026),('3b9fc58a-e9ee-11f0-84e6-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-05 04:23:06',1767586986026),('3b9fc58b-e9ee-11f0-84e6-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-05 04:23:06',1767586986026),('3b9fc58c-e9ee-11f0-84e6-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-05 04:23:06',1767586986026),('3b9fc58d-e9ee-11f0-84e6-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-05 04:23:06',1767586986026),('3b9fc58e-e9ee-11f0-84e6-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-05 04:23:06',1767586986026),('3b9fc58f-e9ee-11f0-84e6-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-05 04:23:06',1767586986026),('3b9fc590-e9ee-11f0-84e6-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',18,'2026-01-05 04:23:06',1767586986026),('3b9fc591-e9ee-11f0-84e6-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-05 04:23:06',1767586986026),('3b9fc592-e9ee-11f0-84e6-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-05 04:23:06',1767586986026),('44a3d956-eb13-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 15:20:44',1767712843695),('44a3d957-eb13-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 15:20:44',1767712843695),('44a3d958-eb13-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 15:20:44',1767712843695),('44a3d959-eb13-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 15:20:44',1767712843695),('44a3d95a-eb13-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 15:20:44',1767712843695),('44a3d95b-eb13-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 15:20:44',1767712843695),('44a3d95c-eb13-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 15:20:44',1767712843695),('44a3d95d-eb13-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 15:20:44',1767712843695),('44a3d95e-eb13-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 15:20:44',1767712843695),('44a3d95f-eb13-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',10,'2026-01-06 15:20:44',1767712843695),('44a3d960-eb13-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 15:20:44',1767712843695),('44a3d961-eb13-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 15:20:44',1767712843695),('47eb73b4-e9e9-11f0-aec6-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-05 03:47:39',1767584859174),('47eb73b5-e9e9-11f0-aec6-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-05 03:47:39',1767584859174),('47eb73b6-e9e9-11f0-aec6-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-05 03:47:39',1767584859174),('47eb73b7-e9e9-11f0-aec6-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-05 03:47:39',1767584859174),('47eb73b8-e9e9-11f0-aec6-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-05 03:47:39',1767584859174),('47eb73b9-e9e9-11f0-aec6-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-05 03:47:39',1767584859174),('47eb73ba-e9e9-11f0-aec6-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-05 03:47:39',1767584859174),('47eb73bb-e9e9-11f0-aec6-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-05 03:47:39',1767584859174),('47eb73bc-e9e9-11f0-aec6-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-05 03:47:39',1767584859174),('47eb73bd-e9e9-11f0-aec6-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',2,'2026-01-05 03:47:39',1767584859174),('47eb73be-e9e9-11f0-aec6-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-05 03:47:39',1767584859174),('47eb73bf-e9e9-11f0-aec6-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-05 03:47:39',1767584859174),('4c488bf2-eb4c-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337833),('4c488bf3-eb4c-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337833),('4c488bf4-eb4c-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337833),('4c488bf5-eb4c-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337833),('4c488bf6-eb4c-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337833),('4c488bf7-eb4c-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337833),('4c488bf8-eb4c-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337833),('4c488bf9-eb4c-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337833),('4c488bfa-eb4c-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337833),('4c488bfb-eb4c-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',15,'2026-01-06 22:08:58',1767737337833),('4c488bfc-eb4c-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337833),('4c488bfd-eb4c-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337833),('4c4b722e-eb4c-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337853),('4c4b722f-eb4c-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337853),('4c4b7230-eb4c-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337853),('4c4b7231-eb4c-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337853),('4c4b7232-eb4c-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337853),('4c4b7233-eb4c-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337853),('4c4b7234-eb4c-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337853),('4c4b7235-eb4c-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337853),('4c4b7236-eb4c-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337853),('4c4b7237-eb4c-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337853),('4c4b7238-eb4c-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337853),('4c4b7239-eb4c-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337853),('4c4d46fa-eb4c-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337865),('4c4d46fb-eb4c-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337865),('4c4d46fc-eb4c-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337865),('4c4d46fd-eb4c-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337865),('4c4d46fe-eb4c-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337865),('4c4d46ff-eb4c-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337865),('4c4d4700-eb4c-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337865),('4c4d4701-eb4c-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337865),('4c4d4702-eb4c-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337865),('4c4d4703-eb4c-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337865),('4c4d4704-eb4c-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337865),('4c4d4705-eb4c-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337865),('4c4ef4b6-eb4c-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337877),('4c4ef4b7-eb4c-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337877),('4c4ef4b8-eb4c-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337877),('4c4ef4b9-eb4c-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337877),('4c4ef4ba-eb4c-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337877),('4c4ef4bb-eb4c-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337877),('4c4ef4bc-eb4c-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337877),('4c4ef4bd-eb4c-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337877),('4c4ef4be-eb4c-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337877),('4c4ef4bf-eb4c-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337877),('4c4ef4c0-eb4c-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337877),('4c4ef4c1-eb4c-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337877),('4c50a272-eb4c-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337887),('4c50a273-eb4c-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337887),('4c50a274-eb4c-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337887),('4c50a275-eb4c-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337887),('4c50a276-eb4c-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337887),('4c50a277-eb4c-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337887),('4c50a278-eb4c-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337887),('4c50a279-eb4c-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337887),('4c50a27a-eb4c-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337887),('4c50a27b-eb4c-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337887),('4c50a27c-eb4c-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337887),('4c50a27d-eb4c-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337887),('4c52020e-eb4c-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337897),('4c52020f-eb4c-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337897),('4c520210-eb4c-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337897),('4c520211-eb4c-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337897),('4c520212-eb4c-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337897),('4c520213-eb4c-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337897),('4c520214-eb4c-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337897),('4c520215-eb4c-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337897),('4c520216-eb4c-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337897),('4c520217-eb4c-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337897),('4c520218-eb4c-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337897),('4c520219-eb4c-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337897),('4c5361aa-eb4c-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337906),('4c5361ab-eb4c-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337906),('4c5361ac-eb4c-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337906),('4c5361ad-eb4c-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337906),('4c5361ae-eb4c-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337906),('4c5361af-eb4c-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337906),('4c5361b0-eb4c-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337906),('4c5361b1-eb4c-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337906),('4c5361b2-eb4c-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337906),('4c5361b3-eb4c-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337906),('4c5361b4-eb4c-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337906),('4c5361b5-eb4c-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337906),('4c54e856-eb4c-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337915),('4c54e857-eb4c-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337915),('4c54e858-eb4c-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337915),('4c54e859-eb4c-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337915),('4c54e85a-eb4c-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337915),('4c54e85b-eb4c-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337915),('4c54e85c-eb4c-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337915),('4c54e85d-eb4c-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337915),('4c54e85e-eb4c-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337915),('4c54e85f-eb4c-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337915),('4c54e860-eb4c-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337915),('4c54e861-eb4c-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337915),('4c5620e2-eb4c-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337924),('4c5620e3-eb4c-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337924),('4c5620e4-eb4c-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337924),('4c5620e5-eb4c-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337924),('4c5620e6-eb4c-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337924),('4c5620e7-eb4c-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337924),('4c5620e8-eb4c-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337924),('4c5620e9-eb4c-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337924),('4c5620ea-eb4c-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337924),('4c5620eb-eb4c-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337924),('4c5620ec-eb4c-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337924),('4c5620ed-eb4c-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337924),('4c57807e-eb4c-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337933),('4c57807f-eb4c-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337933),('4c578080-eb4c-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337933),('4c578081-eb4c-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337933),('4c578082-eb4c-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337933),('4c578083-eb4c-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337933),('4c578084-eb4c-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337933),('4c578085-eb4c-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337933),('4c578086-eb4c-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337933),('4c578087-eb4c-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337933),('4c578088-eb4c-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337933),('4c578089-eb4c-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337933),('4c59072a-eb4c-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337942),('4c59072b-eb4c-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337942),('4c59072c-eb4c-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337942),('4c59072d-eb4c-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337942),('4c59072e-eb4c-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337942),('4c59072f-eb4c-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337942),('4c590730-eb4c-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337942),('4c590731-eb4c-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337942),('4c590732-eb4c-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337942),('4c590733-eb4c-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337942),('4c590734-eb4c-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337942),('4c590735-eb4c-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337942),('4c5a8dd6-eb4c-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337952),('4c5a8dd7-eb4c-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337952),('4c5a8dd8-eb4c-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337952),('4c5a8dd9-eb4c-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337952),('4c5a8dda-eb4c-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337952),('4c5a8ddb-eb4c-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337952),('4c5a8ddc-eb4c-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337952),('4c5a8ddd-eb4c-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337952),('4c5a8dde-eb4c-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337952),('4c5a8ddf-eb4c-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337952),('4c5a8de0-eb4c-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337952),('4c5a8de1-eb4c-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337952),('4c5bc662-eb4c-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337960),('4c5bc663-eb4c-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337960),('4c5bc664-eb4c-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337960),('4c5bc665-eb4c-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337960),('4c5bc666-eb4c-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337960),('4c5bc667-eb4c-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337960),('4c5bc668-eb4c-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337960),('4c5bc669-eb4c-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337960),('4c5bc66a-eb4c-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337960),('4c5bc66b-eb4c-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337960),('4c5bc66c-eb4c-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337960),('4c5bc66d-eb4c-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337960),('4c5cfeee-eb4c-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337969),('4c5d25ff-eb4c-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337969),('4c5d2600-eb4c-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337969),('4c5d2601-eb4c-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337969),('4c5d2602-eb4c-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337969),('4c5d2603-eb4c-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337969),('4c5d2604-eb4c-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337969),('4c5d2605-eb4c-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337969),('4c5d2606-eb4c-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337969),('4c5d2607-eb4c-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337969),('4c5d2608-eb4c-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337969),('4c5d2609-eb4c-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337969),('4c5e377a-eb4c-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337976),('4c5e377b-eb4c-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337976),('4c5e377c-eb4c-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337976),('4c5e377d-eb4c-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337976),('4c5e377e-eb4c-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337976),('4c5e377f-eb4c-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337976),('4c5e3780-eb4c-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337976),('4c5e3781-eb4c-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337976),('4c5e3782-eb4c-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337976),('4c5e3783-eb4c-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337976),('4c5e3784-eb4c-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337976),('4c5e3785-eb4c-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337976),('4c5f48f6-eb4c-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337984),('4c5f48f7-eb4c-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337984),('4c5f48f8-eb4c-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337984),('4c5f48f9-eb4c-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337984),('4c5f48fa-eb4c-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337984),('4c5f48fb-eb4c-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337984),('4c5f48fc-eb4c-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337984),('4c5f48fd-eb4c-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337984),('4c5f48fe-eb4c-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337984),('4c5f48ff-eb4c-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337984),('4c5f4900-eb4c-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337984),('4c5f4901-eb4c-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337984),('4c60cea2-eb4c-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337994),('4c60cea3-eb4c-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337994),('4c60cea4-eb4c-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337994),('4c60cea5-eb4c-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337994),('4c60cea6-eb4c-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337994),('4c60cea7-eb4c-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337994),('4c60cea8-eb4c-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337994),('4c60cea9-eb4c-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337994),('4c60ceaa-eb4c-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337994),('4c60ceab-eb4c-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337994),('4c60ceac-eb4c-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337994),('4c60cead-eb4c-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737337994),('4c62a36e-eb4c-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338005),('4c62a36f-eb4c-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338005),('4c62a370-eb4c-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338005),('4c62a371-eb4c-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338005),('4c62a372-eb4c-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338005),('4c62a373-eb4c-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338005),('4c62a374-eb4c-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338005),('4c62a375-eb4c-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338005),('4c62a376-eb4c-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338005),('4c62a377-eb4c-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338005),('4c62a378-eb4c-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338005),('4c62a379-eb4c-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338005),('4c63dbfa-eb4c-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338014),('4c63dbfb-eb4c-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338014),('4c63dbfc-eb4c-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338014),('4c63dbfd-eb4c-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338014),('4c63dbfe-eb4c-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338014),('4c63dbff-eb4c-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338014),('4c63dc00-eb4c-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338014),('4c63dc01-eb4c-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338014),('4c63dc02-eb4c-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338014),('4c63dc03-eb4c-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338014),('4c63dc04-eb4c-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338014),('4c63dc05-eb4c-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338014),('4c6562a6-eb4c-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338023),('4c6562a7-eb4c-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338023),('4c6562a8-eb4c-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338023),('4c6562a9-eb4c-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338023),('4c6562aa-eb4c-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338023),('4c6562ab-eb4c-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338023),('4c6562ac-eb4c-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338023),('4c6562ad-eb4c-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338023),('4c6562ae-eb4c-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338023),('4c6562af-eb4c-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338023),('4c6562b0-eb4c-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338023),('4c6562b1-eb4c-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338023),('4c66c242-eb4c-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338033),('4c66c243-eb4c-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338033),('4c66c244-eb4c-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338033),('4c66c245-eb4c-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338033),('4c66c246-eb4c-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338033),('4c66c247-eb4c-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338033),('4c66c248-eb4c-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338033),('4c66c249-eb4c-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338033),('4c66e95a-eb4c-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338033),('4c66e95b-eb4c-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338033),('4c66e95c-eb4c-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338033),('4c66e95d-eb4c-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338033),('4c686ffe-eb4c-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338043),('4c686fff-eb4c-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338043),('4c687000-eb4c-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338043),('4c687001-eb4c-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338043),('4c687002-eb4c-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338043),('4c687003-eb4c-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338043),('4c687004-eb4c-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338043),('4c687005-eb4c-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338043),('4c687006-eb4c-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338043),('4c687007-eb4c-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338043),('4c687008-eb4c-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338043),('4c687009-eb4c-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338043),('4c69f6aa-eb4c-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338054),('4c69f6ab-eb4c-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338054),('4c69f6ac-eb4c-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338054),('4c69f6ad-eb4c-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338054),('4c69f6ae-eb4c-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338054),('4c69f6af-eb4c-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338054),('4c69f6b0-eb4c-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338054),('4c69f6b1-eb4c-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338054),('4c69f6b2-eb4c-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338054),('4c69f6b3-eb4c-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338054),('4c69f6b4-eb4c-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338054),('4c69f6b5-eb4c-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338054),('4c6b7d56-eb4c-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338063),('4c6b7d57-eb4c-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338063),('4c6b7d58-eb4c-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338063),('4c6b7d59-eb4c-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338063),('4c6b7d5a-eb4c-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338063),('4c6b7d5b-eb4c-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338063),('4c6b7d5c-eb4c-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338063),('4c6b7d5d-eb4c-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338063),('4c6b7d5e-eb4c-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338063),('4c6b7d5f-eb4c-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338063),('4c6b7d60-eb4c-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338063),('4c6b7d61-eb4c-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338063),('4c6cb5e2-eb4c-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338072),('4c6cb5e3-eb4c-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338072),('4c6cb5e4-eb4c-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338072),('4c6cdcf5-eb4c-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338072),('4c6cdcf6-eb4c-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338072),('4c6cdcf7-eb4c-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338072),('4c6cdcf8-eb4c-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338072),('4c6cdcf9-eb4c-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338072),('4c6cdcfa-eb4c-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338072),('4c6cdcfb-eb4c-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338072),('4c6cdcfc-eb4c-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338072),('4c6cdcfd-eb4c-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338072),('4c6e157e-eb4c-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338080),('4c6e157f-eb4c-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338080),('4c6e1580-eb4c-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338080),('4c6e1581-eb4c-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338080),('4c6e1582-eb4c-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338080),('4c6e1583-eb4c-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338080),('4c6e1584-eb4c-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338080),('4c6e1585-eb4c-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338080),('4c6e1586-eb4c-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338080),('4c6e1587-eb4c-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338080),('4c6e1588-eb4c-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338080),('4c6e1589-eb4c-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338080),('4c6f751a-eb4c-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338089),('4c6f751b-eb4c-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338089),('4c6f751c-eb4c-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338089),('4c6f751d-eb4c-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338089),('4c6f751e-eb4c-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338089),('4c6f751f-eb4c-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338089),('4c6f7520-eb4c-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338089),('4c6f7521-eb4c-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338089),('4c6f7522-eb4c-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338089),('4c6f7523-eb4c-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338089),('4c6f7524-eb4c-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338089),('4c6f7525-eb4c-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 22:08:58',1767737338089),('5381ed46-eab1-11f0-b494-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 03:39:38',1767670777954),('53821457-eab1-11f0-b494-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 03:39:38',1767670777954),('53821458-eab1-11f0-b494-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 03:39:38',1767670777954),('53821459-eab1-11f0-b494-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 03:39:38',1767670777954),('5382145a-eab1-11f0-b494-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 03:39:38',1767670777954),('5382145b-eab1-11f0-b494-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 03:39:38',1767670777954),('5382145c-eab1-11f0-b494-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 03:39:38',1767670777954),('5382145d-eab1-11f0-b494-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 03:39:38',1767670777954),('5382145e-eab1-11f0-b494-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 03:39:38',1767670777954),('5382145f-eab1-11f0-b494-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',18,'2026-01-06 03:39:38',1767670777954),('53821460-eab1-11f0-b494-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 03:39:38',1767670777954),('53821461-eab1-11f0-b494-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 03:39:38',1767670777954),('540771d9-eaa6-11f0-a167-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 02:20:54',1767666054367),('540798ea-eaa6-11f0-a167-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 02:20:54',1767666054367),('540798eb-eaa6-11f0-a167-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 02:20:54',1767666054367),('540798ec-eaa6-11f0-a167-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 02:20:54',1767666054367),('540798ed-eaa6-11f0-a167-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 02:20:54',1767666054367),('540798ee-eaa6-11f0-a167-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 02:20:54',1767666054367),('540798ef-eaa6-11f0-a167-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 02:20:54',1767666054367),('540798f0-eaa6-11f0-a167-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 02:20:54',1767666054367),('540798f1-eaa6-11f0-a167-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 02:20:54',1767666054367),('540798f2-eaa6-11f0-a167-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',18,'2026-01-06 02:20:54',1767666054367),('540798f3-eaa6-11f0-a167-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 02:20:54',1767666054367),('540798f4-eaa6-11f0-a167-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 02:20:54',1767666054367),('602a4f72-e9ea-11f0-b000-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-05 03:55:29',1767585329347),('602a7683-e9ea-11f0-b000-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-05 03:55:29',1767585329347),('602a7684-e9ea-11f0-b000-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-05 03:55:29',1767585329347),('602a7685-e9ea-11f0-b000-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-05 03:55:29',1767585329347),('602a7686-e9ea-11f0-b000-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-05 03:55:29',1767585329347),('602a7687-e9ea-11f0-b000-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-05 03:55:29',1767585329347),('602a7688-e9ea-11f0-b000-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-05 03:55:29',1767585329347),('602a7689-e9ea-11f0-b000-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-05 03:55:29',1767585329347),('602a768a-e9ea-11f0-b000-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-05 03:55:29',1767585329347),('602a768b-e9ea-11f0-b000-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',10,'2026-01-05 03:55:29',1767585329347),('602a768c-e9ea-11f0-b000-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-05 03:55:29',1767585329347),('602a768d-e9ea-11f0-b000-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-05 03:55:29',1767585329347),('6bf048ac-eaa8-11f0-bce1-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 02:35:53',1767666953474),('6bf048ad-eaa8-11f0-bce1-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 02:35:53',1767666953474),('6bf048ae-eaa8-11f0-bce1-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 02:35:53',1767666953474),('6bf048af-eaa8-11f0-bce1-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 02:35:53',1767666953474),('6bf048b0-eaa8-11f0-bce1-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 02:35:53',1767666953474),('6bf048b1-eaa8-11f0-bce1-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 02:35:53',1767666953474),('6bf048b2-eaa8-11f0-bce1-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 02:35:53',1767666953474),('6bf048b3-eaa8-11f0-bce1-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 02:35:53',1767666953474),('6bf048b4-eaa8-11f0-bce1-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 02:35:53',1767666953474),('6bf048b5-eaa8-11f0-bce1-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',7,'2026-01-06 02:35:53',1767666953474),('6bf048b6-eaa8-11f0-bce1-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 02:35:53',1767666953474),('6bf048b7-eaa8-11f0-bce1-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 02:35:53',1767666953474),('6ed2e682-eab9-11f0-bb24-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 04:37:40',1767674259763),('6ed2e683-eab9-11f0-bb24-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 04:37:40',1767674259763),('6ed2e684-eab9-11f0-bb24-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 04:37:40',1767674259763),('6ed2e685-eab9-11f0-bb24-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 04:37:40',1767674259763),('6ed2e686-eab9-11f0-bb24-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 04:37:40',1767674259763),('6ed2e687-eab9-11f0-bb24-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 04:37:40',1767674259763),('6ed2e688-eab9-11f0-bb24-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 04:37:40',1767674259763),('6ed2e689-eab9-11f0-bb24-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 04:37:40',1767674259763),('6ed2e68a-eab9-11f0-bb24-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 04:37:40',1767674259763),('6ed2e68b-eab9-11f0-bb24-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',8,'2026-01-06 04:37:40',1767674259763),('6ed2e68c-eab9-11f0-bb24-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 04:37:40',1767674259763),('6ed2e68d-eab9-11f0-bb24-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 04:37:40',1767674259763),('7ff8d67a-ea9b-11f0-a59d-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 01:03:24',1767661403630),('7ff8fd8b-ea9b-11f0-a59d-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 01:03:24',1767661403630),('7ff8fd8c-ea9b-11f0-a59d-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 01:03:24',1767661403630),('7ff8fd8d-ea9b-11f0-a59d-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 01:03:24',1767661403630),('7ff8fd8e-ea9b-11f0-a59d-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 01:03:24',1767661403630),('7ff8fd8f-ea9b-11f0-a59d-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 01:03:24',1767661403630),('7ff8fd90-ea9b-11f0-a59d-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 01:03:24',1767661403630),('7ff8fd91-ea9b-11f0-a59d-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 01:03:24',1767661403630),('7ff8fd92-ea9b-11f0-a59d-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 01:03:24',1767661403630),('7ff8fd93-ea9b-11f0-a59d-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',18,'2026-01-06 01:03:24',1767661403630),('7ff8fd94-ea9b-11f0-a59d-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 01:03:24',1767661403630),('7ff8fd95-ea9b-11f0-a59d-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 01:03:24',1767661403630),('85720082-ea8b-11f0-938c-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-05 23:09:01',1767654540867),('85720083-ea8b-11f0-938c-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-05 23:09:01',1767654540867),('85720084-ea8b-11f0-938c-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-05 23:09:01',1767654540867),('85720085-ea8b-11f0-938c-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-05 23:09:01',1767654540867),('85720086-ea8b-11f0-938c-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-05 23:09:01',1767654540867),('85720087-ea8b-11f0-938c-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-05 23:09:01',1767654540867),('85720088-ea8b-11f0-938c-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-05 23:09:01',1767654540867),('85720089-ea8b-11f0-938c-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-05 23:09:01',1767654540867),('8572008a-ea8b-11f0-938c-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-05 23:09:01',1767654540867),('8572008b-ea8b-11f0-938c-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-05 23:09:01',1767654540867),('8572008c-ea8b-11f0-938c-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-05 23:09:01',1767654540867),('8572008d-ea8b-11f0-938c-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-05 23:09:01',1767654540867),('893c8bd3-e9ee-11f0-84e6-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-05 04:25:16',1767587116241),('893c8bd4-e9ee-11f0-84e6-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-05 04:25:16',1767587116241),('893c8bd5-e9ee-11f0-84e6-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-05 04:25:16',1767587116241),('893c8bd6-e9ee-11f0-84e6-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-05 04:25:16',1767587116241),('893c8bd7-e9ee-11f0-84e6-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-05 04:25:16',1767587116241),('893c8bd8-e9ee-11f0-84e6-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-05 04:25:16',1767587116241),('893c8bd9-e9ee-11f0-84e6-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-05 04:25:16',1767587116241),('893c8bda-e9ee-11f0-84e6-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-05 04:25:16',1767587116241),('893c8bdb-e9ee-11f0-84e6-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-05 04:25:16',1767587116241),('893c8bdc-e9ee-11f0-84e6-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',2,'2026-01-05 04:25:16',1767587116241),('893c8bdd-e9ee-11f0-84e6-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-05 04:25:16',1767587116241),('893c8bde-e9ee-11f0-84e6-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-05 04:25:16',1767587116241),('986b5016-ea9d-11f0-a59d-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 01:18:24',1767662303641),('986b5017-ea9d-11f0-a59d-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 01:18:24',1767662303641),('986b5018-ea9d-11f0-a59d-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 01:18:24',1767662303641),('986b5019-ea9d-11f0-a59d-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 01:18:24',1767662303641),('986b501a-ea9d-11f0-a59d-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 01:18:24',1767662303641),('986b501b-ea9d-11f0-a59d-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 01:18:24',1767662303641),('986b501c-ea9d-11f0-a59d-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 01:18:24',1767662303641),('986b501d-ea9d-11f0-a59d-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 01:18:24',1767662303641),('986b501e-ea9d-11f0-a59d-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 01:18:24',1767662303641),('986b501f-ea9d-11f0-a59d-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',15,'2026-01-06 01:18:24',1767662303641),('986b5020-ea9d-11f0-a59d-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 01:18:24',1767662303641),('986b5021-ea9d-11f0-a59d-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 01:18:24',1767662303641),('abaee0f1-eaaa-11f0-a48e-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 02:51:59',1767667919415),('abaf0802-eaaa-11f0-a48e-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 02:51:59',1767667919415),('abaf0803-eaaa-11f0-a48e-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 02:51:59',1767667919415),('abaf0804-eaaa-11f0-a48e-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 02:51:59',1767667919415),('abaf0805-eaaa-11f0-a48e-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 02:51:59',1767667919415),('abaf0806-eaaa-11f0-a48e-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 02:51:59',1767667919415),('abaf0807-eaaa-11f0-a48e-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 02:51:59',1767667919415),('abaf0808-eaaa-11f0-a48e-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 02:51:59',1767667919415),('abaf0809-eaaa-11f0-a48e-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 02:51:59',1767667919415),('abaf080a-eaaa-11f0-a48e-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',18,'2026-01-06 02:51:59',1767667919415),('abaf080b-eaaa-11f0-a48e-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 02:51:59',1767667919415),('abaf080c-eaaa-11f0-a48e-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 02:51:59',1767667919415),('b22c16a2-eab1-11f0-b494-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 03:42:17',1767670936780),('b22c16a3-eab1-11f0-b494-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 03:42:17',1767670936780),('b22c16a4-eab1-11f0-b494-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 03:42:17',1767670936780),('b22c16a5-eab1-11f0-b494-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 03:42:17',1767670936780),('b22c16a6-eab1-11f0-b494-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 03:42:17',1767670936780),('b22c16a7-eab1-11f0-b494-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 03:42:17',1767670936780),('b22c16a8-eab1-11f0-b494-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 03:42:17',1767670936780),('b22c16a9-eab1-11f0-b494-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 03:42:17',1767670936780),('b22c16aa-eab1-11f0-b494-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 03:42:17',1767670936780),('b22c16ab-eab1-11f0-b494-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',3,'2026-01-06 03:42:17',1767670936780),('b22c16ac-eab1-11f0-b494-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 03:42:17',1767670936780),('b22c16ad-eab1-11f0-b494-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 03:42:17',1767670936780),('b6555ea7-eaba-11f0-b51d-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 04:46:49',1767674809232),('b65585b8-eaba-11f0-b51d-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 04:46:49',1767674809232),('b65585b9-eaba-11f0-b51d-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 04:46:49',1767674809232),('b65585ba-eaba-11f0-b51d-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 04:46:49',1767674809232),('b65585bb-eaba-11f0-b51d-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 04:46:49',1767674809232),('b65585bc-eaba-11f0-b51d-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 04:46:49',1767674809232),('b65585bd-eaba-11f0-b51d-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 04:46:49',1767674809232),('b65585be-eaba-11f0-b51d-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 04:46:49',1767674809232),('b65585bf-eaba-11f0-b51d-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 04:46:49',1767674809232),('b65585c0-eaba-11f0-b51d-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',9,'2026-01-06 04:46:49',1767674809232),('b65585c1-eaba-11f0-b51d-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 04:46:49',1767674809232),('b65585c2-eaba-11f0-b51d-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 04:46:49',1767674809232),('bcaf9221-eab8-11f0-8c59-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 04:32:41',1767673960897),('bcaf9222-eab8-11f0-8c59-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 04:32:41',1767673960897),('bcaf9223-eab8-11f0-8c59-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 04:32:41',1767673960897),('bcaf9224-eab8-11f0-8c59-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 04:32:41',1767673960897),('bcaf9225-eab8-11f0-8c59-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 04:32:41',1767673960897),('bcaf9226-eab8-11f0-8c59-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 04:32:41',1767673960897),('bcaf9227-eab8-11f0-8c59-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 04:32:41',1767673960897),('bcaf9228-eab8-11f0-8c59-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 04:32:41',1767673960897),('bcaf9229-eab8-11f0-8c59-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 04:32:41',1767673960897),('bcaf922a-eab8-11f0-8c59-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',8,'2026-01-06 04:32:41',1767673960897),('bcaf922b-eab8-11f0-8c59-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 04:32:41',1767673960897),('bcaf922c-eab8-11f0-8c59-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 04:32:41',1767673960897),('bf246785-eaa6-11f0-a167-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 02:23:54',1767666234076),('bf246786-eaa6-11f0-a167-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 02:23:54',1767666234076),('bf246787-eaa6-11f0-a167-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 02:23:54',1767666234076),('bf246788-eaa6-11f0-a167-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 02:23:54',1767666234076),('bf246789-eaa6-11f0-a167-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 02:23:54',1767666234076),('bf24678a-eaa6-11f0-a167-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 02:23:54',1767666234076),('bf24678b-eaa6-11f0-a167-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 02:23:54',1767666234076),('bf24678c-eaa6-11f0-a167-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 02:23:54',1767666234076),('bf24678d-eaa6-11f0-a167-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 02:23:54',1767666234076),('bf24678e-eaa6-11f0-a167-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',3,'2026-01-06 02:23:54',1767666234076),('bf24678f-eaa6-11f0-a167-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 02:23:54',1767666234076),('bf246790-eaa6-11f0-a167-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 02:23:54',1767666234076),('c0be29b6-eb0f-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711333917),('c0be29b7-eb0f-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711333917),('c0be29b8-eb0f-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711333917),('c0be29b9-eb0f-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711333917),('c0be29ba-eb0f-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711333917),('c0be29bb-eb0f-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711333917),('c0be29bc-eb0f-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711333917),('c0be29bd-eb0f-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711333917),('c0be29be-eb0f-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711333917),('c0be29bf-eb0f-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',15,'2026-01-06 14:55:34',1767711333917),('c0be29c0-eb0f-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711333917),('c0be29c1-eb0f-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711333917),('c0c22162-eb0f-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711333945),('c0c22163-eb0f-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711333945),('c0c22164-eb0f-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711333945),('c0c22165-eb0f-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711333945),('c0c22166-eb0f-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711333945),('c0c22167-eb0f-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711333945),('c0c22168-eb0f-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711333945),('c0c22169-eb0f-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711333945),('c0c2216a-eb0f-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711333945),('c0c2216b-eb0f-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711333945),('c0c2216c-eb0f-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711333945),('c0c2216d-eb0f-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711333945),('c0c5079e-eb0f-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711333965),('c0c5079f-eb0f-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711333965),('c0c507a0-eb0f-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711333965),('c0c507a1-eb0f-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711333965),('c0c507a2-eb0f-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711333965),('c0c507a3-eb0f-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711333965),('c0c507a4-eb0f-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711333965),('c0c507a5-eb0f-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711333965),('c0c507a6-eb0f-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711333965),('c0c507a7-eb0f-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711333965),('c0c507a8-eb0f-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711333965),('c0c507a9-eb0f-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711333965),('c0c8630a-eb0f-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711333986),('c0c8630b-eb0f-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711333986),('c0c8630c-eb0f-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711333986),('c0c8630d-eb0f-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711333986),('c0c8630e-eb0f-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711333986),('c0c8630f-eb0f-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711333986),('c0c86310-eb0f-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711333986),('c0c86311-eb0f-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711333986),('c0c86312-eb0f-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711333986),('c0c86313-eb0f-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711333986),('c0c86314-eb0f-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711333986),('c0c86315-eb0f-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711333986),('c0cbe586-eb0f-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334009),('c0cbe587-eb0f-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334009),('c0cbe588-eb0f-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334009),('c0cbe589-eb0f-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334009),('c0cbe58a-eb0f-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334009),('c0cbe58b-eb0f-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334009),('c0cbe58c-eb0f-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334009),('c0cbe58d-eb0f-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334009),('c0cbe58e-eb0f-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334009),('c0cbe58f-eb0f-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334009),('c0cbe590-eb0f-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334009),('c0cbe591-eb0f-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334009),('c0ce7da2-eb0f-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334027),('c0ce7da3-eb0f-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334027),('c0ce7da4-eb0f-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334027),('c0ce7da5-eb0f-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334027),('c0ce7da6-eb0f-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334027),('c0ce7da7-eb0f-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334027),('c0ce7da8-eb0f-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334027),('c0ce7da9-eb0f-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334027),('c0ce7daa-eb0f-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334027),('c0ce7dab-eb0f-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334027),('c0ce7dac-eb0f-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334027),('c0ce7dad-eb0f-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334027),('c0d18aee-eb0f-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334047),('c0d18aef-eb0f-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334047),('c0d18af0-eb0f-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334047),('c0d18af1-eb0f-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334047),('c0d18af2-eb0f-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334047),('c0d18af3-eb0f-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334047),('c0d18af4-eb0f-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334047),('c0d18af5-eb0f-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334047),('c0d18af6-eb0f-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334047),('c0d18af7-eb0f-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334047),('c0d18af8-eb0f-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334047),('c0d18af9-eb0f-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334047),('c0d44a1a-eb0f-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334065),('c0d44a1b-eb0f-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334065),('c0d44a1c-eb0f-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334065),('c0d44a1d-eb0f-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334065),('c0d44a1e-eb0f-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334065),('c0d44a1f-eb0f-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334065),('c0d44a20-eb0f-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334065),('c0d44a21-eb0f-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334065),('c0d44a22-eb0f-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334065),('c0d44a23-eb0f-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334065),('c0d44a24-eb0f-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334065),('c0d44a25-eb0f-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334065),('c0d840c6-eb0f-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334091),('c0d840c7-eb0f-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334091),('c0d840c8-eb0f-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334091),('c0d840c9-eb0f-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334091),('c0d840ca-eb0f-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334091),('c0d840cb-eb0f-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334091),('c0d840cc-eb0f-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334091),('c0d840cd-eb0f-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334091),('c0d840ce-eb0f-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334091),('c0d840cf-eb0f-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334091),('c0d840d0-eb0f-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334091),('c0d840d1-eb0f-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334091),('c0db7522-eb0f-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334112),('c0db7523-eb0f-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334112),('c0db7524-eb0f-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334112),('c0db7525-eb0f-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334112),('c0db7526-eb0f-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334112),('c0db7527-eb0f-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334112),('c0db7528-eb0f-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334112),('c0db7529-eb0f-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334112),('c0db752a-eb0f-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334112),('c0db752b-eb0f-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334112),('c0db752c-eb0f-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334112),('c0db752d-eb0f-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334112),('c0ded08e-eb0f-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334134),('c0ded08f-eb0f-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334134),('c0ded090-eb0f-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334134),('c0ded091-eb0f-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334134),('c0ded092-eb0f-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334134),('c0ded093-eb0f-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334134),('c0ded094-eb0f-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334134),('c0ded095-eb0f-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334134),('c0ded096-eb0f-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334134),('c0ded097-eb0f-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334134),('c0ded098-eb0f-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334134),('c0ded099-eb0f-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 14:55:34',1767711334134),('c1c80d3a-eb11-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 15:09:55',1767712194654),('c1c80d3b-eb11-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 15:09:55',1767712194654),('c1c80d3c-eb11-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 15:09:55',1767712194654),('c1c80d3d-eb11-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 15:09:55',1767712194654),('c1c80d3e-eb11-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 15:09:55',1767712194654),('c1c80d3f-eb11-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 15:09:55',1767712194654),('c1c80d40-eb11-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 15:09:55',1767712194654),('c1c80d41-eb11-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 15:09:55',1767712194654),('c1c80d42-eb11-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 15:09:55',1767712194654),('c1c80d43-eb11-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',10,'2026-01-06 15:09:55',1767712194654),('c1c80d44-eb11-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 15:09:55',1767712194654),('c1c80d45-eb11-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 15:09:55',1767712194654),('c41fd3ed-eaac-11f0-a48e-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 03:06:59',1767668819415),('c41fd3ee-eaac-11f0-a48e-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 03:06:59',1767668819415),('c41fd3ef-eaac-11f0-a48e-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 03:06:59',1767668819415),('c41fd3f0-eaac-11f0-a48e-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 03:06:59',1767668819415),('c41fd3f1-eaac-11f0-a48e-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 03:06:59',1767668819415),('c41fd3f2-eaac-11f0-a48e-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 03:06:59',1767668819415),('c41fd3f3-eaac-11f0-a48e-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 03:06:59',1767668819415),('c41fd3f4-eaac-11f0-a48e-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 03:06:59',1767668819415),('c41fd3f5-eaac-11f0-a48e-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 03:06:59',1767668819415),('c41fd3f6-eaac-11f0-a48e-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',15,'2026-01-06 03:06:59',1767668819415),('c41fd3f7-eaac-11f0-a48e-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 03:06:59',1767668819415),('c41fd3f8-eaac-11f0-a48e-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 03:06:59',1767668819415),('c69e7d3a-eab9-11f0-808d-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 04:40:07',1767674407057),('c69ea44b-eab9-11f0-808d-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 04:40:07',1767674407057),('c69ea44c-eab9-11f0-808d-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 04:40:07',1767674407057),('c69ea44d-eab9-11f0-808d-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 04:40:07',1767674407057),('c69ea44e-eab9-11f0-808d-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 04:40:07',1767674407057),('c69ea44f-eab9-11f0-808d-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 04:40:07',1767674407057),('c69ea450-eab9-11f0-808d-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 04:40:07',1767674407057),('c69ea451-eab9-11f0-808d-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 04:40:07',1767674407057),('c69ea452-eab9-11f0-808d-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 04:40:07',1767674407057),('c69ea453-eab9-11f0-808d-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',5,'2026-01-06 04:40:07',1767674407057),('c69ea454-eab9-11f0-808d-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 04:40:07',1767674407057),('c69ea455-eab9-11f0-808d-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 04:40:07',1767674407057),('c7bff5a2-ea98-11f0-aa29-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 00:43:56',1767660235559),('c7bff5a3-ea98-11f0-aa29-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 00:43:56',1767660235560),('c7bff5a4-ea98-11f0-aa29-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 00:43:56',1767660235560),('c7bff5a5-ea98-11f0-aa29-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 00:43:56',1767660235560),('c7bff5a6-ea98-11f0-aa29-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 00:43:56',1767660235560),('c7bff5a7-ea98-11f0-aa29-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 00:43:56',1767660235560),('c7bff5a8-ea98-11f0-aa29-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 00:43:56',1767660235560),('c7bff5a9-ea98-11f0-aa29-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 00:43:56',1767660235560),('c7bff5aa-ea98-11f0-aa29-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 00:43:56',1767660235560),('c7bff5ab-ea98-11f0-aa29-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',18,'2026-01-06 00:43:56',1767660235560),('c7bff5ac-ea98-11f0-aa29-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 00:43:56',1767660235560),('c7bff5ad-ea98-11f0-aa29-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 00:43:56',1767660235560),('c8a99139-eaa3-11f0-9fbe-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 02:02:42',1767664961558),('c8a9913a-eaa3-11f0-9fbe-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 02:02:42',1767664961558),('c8a9913b-eaa3-11f0-9fbe-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 02:02:42',1767664961558),('c8a9913c-eaa3-11f0-9fbe-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 02:02:42',1767664961558),('c8a9913d-eaa3-11f0-9fbe-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 02:02:42',1767664961558),('c8a9913e-eaa3-11f0-9fbe-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 02:02:42',1767664961558),('c8a9913f-eaa3-11f0-9fbe-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 02:02:42',1767664961558),('c8a99140-eaa3-11f0-9fbe-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 02:02:42',1767664961558),('c8a99141-eaa3-11f0-9fbe-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 02:02:42',1767664961558),('c8a99142-eaa3-11f0-9fbe-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',14,'2026-01-06 02:02:42',1767664961558),('c8a99143-eaa3-11f0-9fbe-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 02:02:42',1767664961558),('c8a99144-eaa3-11f0-9fbe-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 02:02:42',1767664961558),('c8d2c79a-eaa7-11f0-9335-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 02:31:20',1767666679812),('c8d2c79b-eaa7-11f0-9335-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 02:31:20',1767666679812),('c8d2c79c-eaa7-11f0-9335-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 02:31:20',1767666679812),('c8d2c79d-eaa7-11f0-9335-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 02:31:20',1767666679812),('c8d2c79e-eaa7-11f0-9335-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 02:31:20',1767666679812),('c8d2c79f-eaa7-11f0-9335-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 02:31:20',1767666679812),('c8d2c7a0-eaa7-11f0-9335-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 02:31:20',1767666679812),('c8d2c7a1-eaa7-11f0-9335-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 02:31:20',1767666679812),('c8d2c7a2-eaa7-11f0-9335-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 02:31:20',1767666679812),('c8d2c7a3-eaa7-11f0-9335-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',10,'2026-01-06 02:31:20',1767666679812),('c8d2c7a4-eaa7-11f0-9335-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 02:31:20',1767666679812),('c8d2c7a5-eaa7-11f0-9335-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 02:31:20',1767666679812),('c9179c2b-eaa0-11f0-a176-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 01:41:14',1767663673788),('c9179c2c-eaa0-11f0-a176-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 01:41:14',1767663673788),('c9179c2d-eaa0-11f0-a176-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 01:41:14',1767663673788),('c9179c2e-eaa0-11f0-a176-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 01:41:14',1767663673788),('c9179c2f-eaa0-11f0-a176-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 01:41:14',1767663673788),('c9179c30-eaa0-11f0-a176-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 01:41:14',1767663673788),('c9179c31-eaa0-11f0-a176-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 01:41:14',1767663673788),('c9179c32-eaa0-11f0-a176-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 01:41:14',1767663673788),('c9179c33-eaa0-11f0-a176-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 01:41:14',1767663673788),('c9179c34-eaa0-11f0-a176-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',8,'2026-01-06 01:41:14',1767663673788),('c9179c35-eaa0-11f0-a176-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 01:41:14',1767663673788),('c9179c36-eaa0-11f0-a176-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 01:41:14',1767663673788),('f102d8b6-eb4d-11f0-8115-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 22:20:44',1767738043698),('f102d8b7-eb4d-11f0-8115-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 22:20:44',1767738043698),('f102d8b8-eb4d-11f0-8115-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 22:20:44',1767738043698),('f102d8b9-eb4d-11f0-8115-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 22:20:44',1767738043698),('f102d8ba-eb4d-11f0-8115-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 22:20:44',1767738043698),('f102ffcb-eb4d-11f0-8115-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 22:20:44',1767738043698),('f102ffcc-eb4d-11f0-8115-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 22:20:44',1767738043698),('f102ffcd-eb4d-11f0-8115-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 22:20:44',1767738043698),('f102ffce-eb4d-11f0-8115-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 22:20:44',1767738043698),('f102ffcf-eb4d-11f0-8115-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',12,'2026-01-06 22:20:44',1767738043698),('f102ffd0-eb4d-11f0-8115-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 22:20:44',1767738043698),('f102ffd1-eb4d-11f0-8115-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 22:20:44',1767738043698),('fd8b9225-ea93-11f0-8857-7015fbb5741b','root-process-instance-start','192.168.1.120$default',0,'2026-01-06 00:09:38',1767658178332),('fd8bb936-ea93-11f0-8857-7015fbb5741b','activity-instance-start','192.168.1.120$default',0,'2026-01-06 00:09:38',1767658178332),('fd8bb937-ea93-11f0-8857-7015fbb5741b','job-acquired-failure','192.168.1.120$default',0,'2026-01-06 00:09:38',1767658178332),('fd8bb938-ea93-11f0-8857-7015fbb5741b','job-locked-exclusive','192.168.1.120$default',0,'2026-01-06 00:09:38',1767658178332),('fd8bb939-ea93-11f0-8857-7015fbb5741b','job-execution-rejected','192.168.1.120$default',0,'2026-01-06 00:09:38',1767658178332),('fd8bb93a-ea93-11f0-8857-7015fbb5741b','executed-decision-elements','192.168.1.120$default',0,'2026-01-06 00:09:38',1767658178332),('fd8bb93b-ea93-11f0-8857-7015fbb5741b','activity-instance-end','192.168.1.120$default',0,'2026-01-06 00:09:38',1767658178332),('fd8bb93c-ea93-11f0-8857-7015fbb5741b','job-successful','192.168.1.120$default',0,'2026-01-06 00:09:38',1767658178332),('fd8bb93d-ea93-11f0-8857-7015fbb5741b','job-acquired-success','192.168.1.120$default',0,'2026-01-06 00:09:38',1767658178332),('fd8bb93e-ea93-11f0-8857-7015fbb5741b','job-acquisition-attempt','192.168.1.120$default',0,'2026-01-06 00:09:38',1767658178332),('fd8bb93f-ea93-11f0-8857-7015fbb5741b','executed-decision-instances','192.168.1.120$default',0,'2026-01-06 00:09:38',1767658178332),('fd8bb940-ea93-11f0-8857-7015fbb5741b','job-failed','192.168.1.120$default',0,'2026-01-06 00:09:38',1767658178332);
/*!40000 ALTER TABLE `act_ru_meter_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_ru_task`
--

DROP TABLE IF EXISTS `act_ru_task`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_ru_task` (
  `ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `REV_` int DEFAULT NULL,
  `EXECUTION_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `PROC_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `PROC_DEF_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `CASE_EXECUTION_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `CASE_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `CASE_DEF_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `NAME_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `PARENT_TASK_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `DESCRIPTION_` varchar(4000) COLLATE utf8mb3_bin DEFAULT NULL,
  `TASK_DEF_KEY_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `OWNER_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `ASSIGNEE_` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  `DELEGATION_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `PRIORITY_` int DEFAULT NULL,
  `CREATE_TIME_` datetime DEFAULT NULL,
  `LAST_UPDATED_` datetime DEFAULT NULL,
  `DUE_DATE_` datetime DEFAULT NULL,
  `FOLLOW_UP_DATE_` datetime DEFAULT NULL,
  `SUSPENSION_STATE_` int DEFAULT NULL,
  `TENANT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  PRIMARY KEY (`ID_`),
  KEY `ACT_IDX_TASK_CREATE` (`CREATE_TIME_`),
  KEY `ACT_IDX_TASK_LAST_UPDATED` (`LAST_UPDATED_`),
  KEY `ACT_IDX_TASK_ASSIGNEE` (`ASSIGNEE_`),
  KEY `ACT_IDX_TASK_OWNER` (`OWNER_`),
  KEY `ACT_IDX_TASK_TENANT_ID` (`TENANT_ID_`),
  KEY `ACT_FK_TASK_EXE` (`EXECUTION_ID_`),
  KEY `ACT_FK_TASK_PROCINST` (`PROC_INST_ID_`),
  KEY `ACT_FK_TASK_PROCDEF` (`PROC_DEF_ID_`),
  KEY `ACT_FK_TASK_CASE_EXE` (`CASE_EXECUTION_ID_`),
  KEY `ACT_FK_TASK_CASE_DEF` (`CASE_DEF_ID_`),
  CONSTRAINT `ACT_FK_TASK_CASE_DEF` FOREIGN KEY (`CASE_DEF_ID_`) REFERENCES `act_re_case_def` (`ID_`),
  CONSTRAINT `ACT_FK_TASK_CASE_EXE` FOREIGN KEY (`CASE_EXECUTION_ID_`) REFERENCES `act_ru_case_execution` (`ID_`),
  CONSTRAINT `ACT_FK_TASK_EXE` FOREIGN KEY (`EXECUTION_ID_`) REFERENCES `act_ru_execution` (`ID_`),
  CONSTRAINT `ACT_FK_TASK_PROCDEF` FOREIGN KEY (`PROC_DEF_ID_`) REFERENCES `act_re_procdef` (`ID_`),
  CONSTRAINT `ACT_FK_TASK_PROCINST` FOREIGN KEY (`PROC_INST_ID_`) REFERENCES `act_ru_execution` (`ID_`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_ru_task`
--

LOCK TABLES `act_ru_task` WRITE;
/*!40000 ALTER TABLE `act_ru_task` DISABLE KEYS */;
/*!40000 ALTER TABLE `act_ru_task` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_ru_task_meter_log`
--

DROP TABLE IF EXISTS `act_ru_task_meter_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_ru_task_meter_log` (
  `ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `ASSIGNEE_HASH_` bigint DEFAULT NULL,
  `TIMESTAMP_` datetime DEFAULT NULL,
  PRIMARY KEY (`ID_`),
  KEY `ACT_IDX_TASK_METER_LOG_TIME` (`TIMESTAMP_`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_ru_task_meter_log`
--

LOCK TABLES `act_ru_task_meter_log` WRITE;
/*!40000 ALTER TABLE `act_ru_task_meter_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `act_ru_task_meter_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_ru_variable`
--

DROP TABLE IF EXISTS `act_ru_variable`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_ru_variable` (
  `ID_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `REV_` int DEFAULT NULL,
  `TYPE_` varchar(255) COLLATE utf8mb3_bin NOT NULL,
  `NAME_` varchar(255) COLLATE utf8mb3_bin NOT NULL,
  `EXECUTION_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `PROC_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `PROC_DEF_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `CASE_EXECUTION_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `CASE_INST_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `TASK_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `BATCH_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `BYTEARRAY_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  `DOUBLE_` double DEFAULT NULL,
  `LONG_` bigint DEFAULT NULL,
  `TEXT_` varchar(4000) COLLATE utf8mb3_bin DEFAULT NULL,
  `TEXT2_` varchar(4000) COLLATE utf8mb3_bin DEFAULT NULL,
  `VAR_SCOPE_` varchar(64) COLLATE utf8mb3_bin NOT NULL,
  `SEQUENCE_COUNTER_` bigint DEFAULT NULL,
  `IS_CONCURRENT_LOCAL_` tinyint DEFAULT NULL,
  `TENANT_ID_` varchar(64) COLLATE utf8mb3_bin DEFAULT NULL,
  PRIMARY KEY (`ID_`),
  UNIQUE KEY `ACT_UNIQ_VARIABLE` (`VAR_SCOPE_`,`NAME_`),
  KEY `ACT_IDX_VARIABLE_TASK_ID` (`TASK_ID_`),
  KEY `ACT_IDX_VARIABLE_TENANT_ID` (`TENANT_ID_`),
  KEY `ACT_IDX_VARIABLE_TASK_NAME_TYPE` (`TASK_ID_`,`NAME_`,`TYPE_`),
  KEY `ACT_FK_VAR_EXE` (`EXECUTION_ID_`),
  KEY `ACT_FK_VAR_PROCINST` (`PROC_INST_ID_`),
  KEY `ACT_FK_VAR_BYTEARRAY` (`BYTEARRAY_ID_`),
  KEY `ACT_IDX_BATCH_ID` (`BATCH_ID_`),
  KEY `ACT_FK_VAR_CASE_EXE` (`CASE_EXECUTION_ID_`),
  KEY `ACT_FK_VAR_CASE_INST` (`CASE_INST_ID_`),
  CONSTRAINT `ACT_FK_VAR_BATCH` FOREIGN KEY (`BATCH_ID_`) REFERENCES `act_ru_batch` (`ID_`),
  CONSTRAINT `ACT_FK_VAR_BYTEARRAY` FOREIGN KEY (`BYTEARRAY_ID_`) REFERENCES `act_ge_bytearray` (`ID_`),
  CONSTRAINT `ACT_FK_VAR_CASE_EXE` FOREIGN KEY (`CASE_EXECUTION_ID_`) REFERENCES `act_ru_case_execution` (`ID_`),
  CONSTRAINT `ACT_FK_VAR_CASE_INST` FOREIGN KEY (`CASE_INST_ID_`) REFERENCES `act_ru_case_execution` (`ID_`),
  CONSTRAINT `ACT_FK_VAR_EXE` FOREIGN KEY (`EXECUTION_ID_`) REFERENCES `act_ru_execution` (`ID_`),
  CONSTRAINT `ACT_FK_VAR_PROCINST` FOREIGN KEY (`PROC_INST_ID_`) REFERENCES `act_ru_execution` (`ID_`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_ru_variable`
--

LOCK TABLES `act_ru_variable` WRITE;
/*!40000 ALTER TABLE `act_ru_variable` DISABLE KEYS */;
/*!40000 ALTER TABLE `act_ru_variable` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `agencies`
--

DROP TABLE IF EXISTS `agencies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agencies` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `active` bit(1) DEFAULT NULL,
  `address` text,
  `city` varchar(255) DEFAULT NULL,
  `code` varchar(255) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `manager_name` varchar(255) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `region` varchar(255) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_agency_code` (`code`),
  KEY `idx_agency_region` (`region`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `agencies`
--

LOCK TABLES `agencies` WRITE;
/*!40000 ALTER TABLE `agencies` DISABLE KEYS */;
/*!40000 ALTER TABLE `agencies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `agency_correction_stats`
--

DROP TABLE IF EXISTS `agency_correction_stats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agency_correction_stats` (
  `agency_code` char(5) COLLATE utf8mb4_unicode_ci NOT NULL,
  `agency_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_anomalies` int DEFAULT '0',
  `fixed_anomalies` int DEFAULT '0',
  `in_review_anomalies` int DEFAULT '0',
  `rejected_anomalies` int DEFAULT '0',
  `correction_rate` decimal(5,2) DEFAULT '0.00',
  `last_updated` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`agency_code`),
  KEY `idx_agency_stats_code` (`agency_code`),
  KEY `idx_agency_stats_rate` (`correction_rate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `agency_correction_stats`
--

LOCK TABLES `agency_correction_stats` WRITE;
/*!40000 ALTER TABLE `agency_correction_stats` DISABLE KEYS */;
INSERT INTO `agency_correction_stats` VALUES ('01001','Agence Ganhi',1500,800,400,300,53.33,'2026-01-04 18:57:09'),('01002','Agence Haie Vive',1200,650,350,200,54.17,'2026-01-04 18:57:09'),('01003','Agence Cadjehoun',1800,900,500,400,50.00,'2026-01-04 18:57:09');
/*!40000 ALTER TABLE `agency_correction_stats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `anomalies`
--

DROP TABLE IF EXISTS `anomalies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `anomalies` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `agency_code` varchar(255) NOT NULL,
  `agency_name` varchar(255) DEFAULT NULL,
  `client_name` varchar(255) NOT NULL,
  `client_number` varchar(255) NOT NULL,
  `client_type` enum('INDIVIDUAL','CORPORATE','INSTITUTIONAL') NOT NULL,
  `corrected_at` datetime(6) DEFAULT NULL,
  `corrected_by` varchar(255) DEFAULT NULL,
  `correction_value` text,
  `created_at` datetime(6) NOT NULL,
  `current_value` text,
  `data_source` varchar(255) DEFAULT NULL,
  `error_message` text,
  `error_type` varchar(255) DEFAULT NULL,
  `expected_value` text,
  `field_label` varchar(255) DEFAULT NULL,
  `field_name` varchar(255) NOT NULL,
  `severity` varchar(255) DEFAULT NULL,
  `status` enum('PENDING','IN_PROGRESS','CORRECTED','VALIDATED','REJECTED','CLOSED') NOT NULL,
  `ticket_id` bigint DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `validated_at` datetime(6) DEFAULT NULL,
  `validated_by` varchar(255) DEFAULT NULL,
  `validation_comment` text,
  PRIMARY KEY (`id`),
  KEY `idx_anomaly_client_type` (`client_type`),
  KEY `idx_anomaly_status` (`status`),
  KEY `idx_anomaly_agency` (`agency_code`),
  KEY `idx_anomaly_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `anomalies`
--

LOCK TABLES `anomalies` WRITE;
/*!40000 ALTER TABLE `anomalies` DISABLE KEYS */;
/*!40000 ALTER TABLE `anomalies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `anomaly_history`
--

DROP TABLE IF EXISTS `anomaly_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `anomaly_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cli` char(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `field` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `old_value` text COLLATE utf8mb4_unicode_ci,
  `new_value` text COLLATE utf8mb4_unicode_ci,
  `status` enum('detected','in_review','fixed','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'detected',
  `agency_code` char(5) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_anomaly_history_cli` (`cli`),
  KEY `idx_anomaly_history_status` (`status`),
  KEY `idx_anomaly_history_agency_code` (`agency_code`),
  KEY `idx_anomaly_history_created_at` (`created_at`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `anomaly_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `anomaly_history`
--

LOCK TABLES `anomaly_history` WRITE;
/*!40000 ALTER TABLE `anomaly_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `anomaly_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bkadcli`
--

DROP TABLE IF EXISTS `bkadcli`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bkadcli` (
  `cli` char(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `typ` char(2) COLLATE utf8mb4_unicode_ci NOT NULL,
  `adr1` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `adr2` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `adr3` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ville` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cpay` char(3) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`cli`,`typ`),
  KEY `idx_bkadcli_cli` (`cli`),
  KEY `idx_bkadcli_cpay` (`cpay`),
  CONSTRAINT `bkadcli_ibfk_1` FOREIGN KEY (`cli`) REFERENCES `bkcli` (`cli`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bkadcli`
--

LOCK TABLES `bkadcli` WRITE;
/*!40000 ALTER TABLE `bkadcli` DISABLE KEYS */;
/*!40000 ALTER TABLE `bkadcli` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bkcli`
--

DROP TABLE IF EXISTS `bkcli`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bkcli` (
  `cli` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nom` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tcli` varchar(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pre` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nid` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nmer` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dna` date DEFAULT NULL,
  `nat` varchar(3) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `age` varchar(5) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sext` varchar(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `viln` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payn` varchar(3) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tid` varchar(3) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vid` date DEFAULT NULL,
  `nrc` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `datc` date DEFAULT NULL,
  `rso` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sig` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sec` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fju` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `catn` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lienbq` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dou` date DEFAULT NULL,
  `clifam` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`cli`),
  KEY `idx_bkcli_tcli` (`tcli`),
  KEY `idx_bkcli_age` (`age`),
  KEY `idx_bkcli_nat` (`nat`),
  KEY `idx_bkcli_payn` (`payn`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bkcli`
--

LOCK TABLES `bkcli` WRITE;
/*!40000 ALTER TABLE `bkcli` DISABLE KEYS */;
INSERT INTO `bkcli` VALUES ('CLI000001','TRAORE','1','Mamadou','ML12345','DIALLO Fatoumata','1985-03-15','ML','01001','M','Bamako','ML','CNI',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-01-04 18:57:09','2026-01-04 18:57:09'),('CLI000002','DIALLO','1','Aissata','ML23456','TOURE Mariam','1990-07-22','ML','01002','F','Sikasso','ML','CNI',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-01-04 18:57:09','2026-01-04 18:57:09'),('CLI000003','COULIBALY','1','Ibrahim','ML34567','KEITA Kadiatou','1978-11-30','ML','01003','M','Segou','ML','CNI',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-01-04 18:57:09','2026-01-04 18:57:09'),('CLI000004','KEITA','1','Fatoumata','','',NULL,'ML','01001','F','','','',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-01-04 18:57:09','2026-01-04 18:57:09'),('CLI000005','TOURE','1','Sekou','ML56789','','1995-05-10','','01002','M','Kayes','ML','CNI',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-01-04 18:57:09','2026-01-04 18:57:09'),('CLI000006','SMITH','1','John','US12345','SMITH Mary','1980-12-01','US','01001','M','New York','US','PSP',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-01-04 18:57:09','2026-01-04 18:57:09'),('CLI000007','JOHNSON','1','Sarah','US23456','JOHNSON Emma','1992-03-25','US','01002','F','Chicago','US','PSP',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-01-04 18:57:09','2026-01-04 18:57:09'),('CLI000008','WILLIAMS','1','Robert','','',NULL,'US','01003','M','','','',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-01-04 18:57:09','2026-01-04 18:57:09'),('ENT000001','SOCIETE A','2',NULL,NULL,NULL,NULL,NULL,'01001',NULL,NULL,NULL,NULL,NULL,'MA12345','2010-01-15','SOCIETE ANONYME A','SA','Commerce','SA','GE','Client',NULL,NULL,'2026-01-04 18:57:09','2026-01-04 18:57:09'),('ENT000002','SOCIETE B','2',NULL,NULL,NULL,NULL,NULL,'01002',NULL,NULL,NULL,NULL,NULL,'MA23456','2015-06-20','SOCIETE ANONYME B','SB','Service','SARL','PME','Client',NULL,NULL,'2026-01-04 18:57:09','2026-01-04 18:57:09'),('ENT000003','SOCIETE C','2',NULL,NULL,NULL,NULL,NULL,'01003',NULL,NULL,NULL,NULL,NULL,'',NULL,'','','','','','',NULL,NULL,'2026-01-04 18:57:09','2026-01-04 18:57:09'),('ENT000004','US COMPANY','2',NULL,NULL,NULL,NULL,NULL,'01001',NULL,NULL,NULL,NULL,NULL,'US12345','2008-03-10','US CORPORATION','USC','Finance','INC','GE','Client',NULL,NULL,'2026-01-04 18:57:09','2026-01-04 18:57:09'),('INS000001','INSTITUTION A','3',NULL,NULL,NULL,NULL,NULL,'01001',NULL,NULL,NULL,NULL,NULL,'ML98765','2005-01-01','INSTITUTION PUBLIQUE A',NULL,'Public','EP','GE','Client',NULL,NULL,'2026-01-04 18:57:09','2026-01-04 18:57:09'),('INS000002','INSTITUTION B','3',NULL,NULL,NULL,NULL,NULL,'01002',NULL,NULL,NULL,NULL,NULL,'ML87654','2010-06-15','INSTITUTION PUBLIQUE B',NULL,'Education','EP','GE','Client',NULL,NULL,'2026-01-04 18:57:09','2026-01-04 18:57:09'),('INS000003','INSTITUTION C','3',NULL,NULL,NULL,NULL,NULL,'01003',NULL,NULL,NULL,NULL,NULL,'',NULL,'',NULL,'','','','',NULL,NULL,'2026-01-04 18:57:09','2026-01-04 18:57:09');
/*!40000 ALTER TABLE `bkcli` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bkcoj`
--

DROP TABLE IF EXISTS `bkcoj`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bkcoj` (
  `clip` char(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ord` int NOT NULL,
  `cli` char(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nom` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pre` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`clip`,`ord`),
  KEY `idx_bkcoj_clip` (`clip`),
  KEY `idx_bkcoj_cli` (`cli`),
  CONSTRAINT `bkcoj_ibfk_1` FOREIGN KEY (`clip`) REFERENCES `bkcli` (`cli`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bkcoj`
--

LOCK TABLES `bkcoj` WRITE;
/*!40000 ALTER TABLE `bkcoj` DISABLE KEYS */;
/*!40000 ALTER TABLE `bkcoj` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bkcom`
--

DROP TABLE IF EXISTS `bkcom`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bkcom` (
  `cli` char(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cha` char(6) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dev` char(3) COLLATE utf8mb4_unicode_ci NOT NULL,
  `age` char(5) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ncp` char(11) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cfe` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`cli`,`cha`,`dev`,`age`,`ncp`),
  KEY `idx_bkcom_cli` (`cli`),
  KEY `idx_bkcom_cha` (`cha`),
  CONSTRAINT `bkcom_ibfk_1` FOREIGN KEY (`cli`) REFERENCES `bkcli` (`cli`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bkcom`
--

LOCK TABLES `bkcom` WRITE;
/*!40000 ALTER TABLE `bkcom` DISABLE KEYS */;
/*!40000 ALTER TABLE `bkcom` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bkemacli`
--

DROP TABLE IF EXISTS `bkemacli`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bkemacli` (
  `cli` char(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`cli`,`email`),
  KEY `idx_bkemacli_cli` (`cli`),
  CONSTRAINT `bkemacli_ibfk_1` FOREIGN KEY (`cli`) REFERENCES `bkcli` (`cli`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bkemacli`
--

LOCK TABLES `bkemacli` WRITE;
/*!40000 ALTER TABLE `bkemacli` DISABLE KEYS */;
/*!40000 ALTER TABLE `bkemacli` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bkpscm`
--

DROP TABLE IF EXISTS `bkpscm`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bkpscm` (
  `cli` char(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ord` int NOT NULL,
  `clim` char(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nom` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pre` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`cli`,`ord`),
  KEY `idx_bkpscm_cli` (`cli`),
  KEY `idx_bkpscm_clim` (`clim`),
  CONSTRAINT `bkpscm_ibfk_1` FOREIGN KEY (`cli`) REFERENCES `bkcli` (`cli`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bkpscm`
--

LOCK TABLES `bkpscm` WRITE;
/*!40000 ALTER TABLE `bkpscm` DISABLE KEYS */;
/*!40000 ALTER TABLE `bkpscm` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bktelcli`
--

DROP TABLE IF EXISTS `bktelcli`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bktelcli` (
  `cli` char(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `typ` char(3) COLLATE utf8mb4_unicode_ci NOT NULL,
  `num` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`cli`,`typ`),
  KEY `idx_bktelcli_cli` (`cli`),
  KEY `idx_bktelcli_num` (`num`),
  CONSTRAINT `bktelcli_ibfk_1` FOREIGN KEY (`cli`) REFERENCES `bkcli` (`cli`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bktelcli`
--

LOCK TABLES `bktelcli` WRITE;
/*!40000 ALTER TABLE `bktelcli` DISABLE KEYS */;
/*!40000 ALTER TABLE `bktelcli` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `correction_stats`
--

DROP TABLE IF EXISTS `correction_stats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `correction_stats` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `agency_code` varchar(255) NOT NULL,
  `agency_name` varchar(255) DEFAULT NULL,
  `avg_correction_time_hours` double DEFAULT NULL,
  `corrected_anomalies` int DEFAULT NULL,
  `correction_rate` double DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `month_number` int DEFAULT NULL,
  `pending_anomalies` int DEFAULT NULL,
  `stats_date` date NOT NULL,
  `total_anomalies` int DEFAULT NULL,
  `validated_anomalies` int DEFAULT NULL,
  `week_number` int DEFAULT NULL,
  `year_number` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_stats_agency` (`agency_code`),
  KEY `idx_stats_date` (`stats_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `correction_stats`
--

LOCK TABLES `correction_stats` WRITE;
/*!40000 ALTER TABLE `correction_stats` DISABLE KEYS */;
/*!40000 ALTER TABLE `correction_stats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `data_load_history`
--

DROP TABLE IF EXISTS `data_load_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `data_load_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `table_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `records_count` int DEFAULT '0',
  `load_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `load_status` enum('success','warning','error') COLLATE utf8mb4_unicode_ci DEFAULT 'success',
  `error_message` text COLLATE utf8mb4_unicode_ci,
  `loaded_by` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `execution_time_ms` int DEFAULT NULL,
  `anomalies_detected` int DEFAULT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` bigint DEFAULT NULL,
  `file_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `processing_time_ms` bigint DEFAULT NULL,
  `records_failed` int DEFAULT NULL,
  `records_processed` int DEFAULT NULL,
  `records_success` int DEFAULT NULL,
  `records_total` int DEFAULT NULL,
  `status` enum('PENDING','IN_PROGRESS','COMPLETED','FAILED','PARTIALLY_COMPLETED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `uploaded_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_data_load_table` (`table_name`),
  KEY `idx_data_load_date` (`load_date`),
  KEY `idx_data_load_status` (`load_status`),
  KEY `idx_load_status` (`status`),
  KEY `idx_load_date` (`load_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `data_load_history`
--

LOCK TABLES `data_load_history` WRITE;
/*!40000 ALTER TABLE `data_load_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `data_load_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fatca_audit_log`
--

DROP TABLE IF EXISTS `fatca_audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fatca_audit_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cli` char(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `previous_status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `new_status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `performed_by` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_fatca_audit_log_cli` (`cli`),
  KEY `idx_fatca_audit_log_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fatca_audit_log`
--

LOCK TABLES `fatca_audit_log` WRITE;
/*!40000 ALTER TABLE `fatca_audit_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `fatca_audit_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fatca_clients`
--

DROP TABLE IF EXISTS `fatca_clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fatca_clients` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `cli` char(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nom` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_entree_relation` date DEFAULT NULL,
  `status_client` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pays_naissance` char(3) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nationalite` char(3) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `adresse` text COLLATE utf8mb4_unicode_ci,
  `pays_adresse` char(3) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telephone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `relation_client` char(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type_relation` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fatca_status` enum('COMPLIANT','NON_COMPLIANT','PENDING_REVIEW','UNDER_INVESTIGATION','EXEMPT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `fatca_date` date DEFAULT NULL,
  `fatca_uti` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `agency_code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `agency_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `birth_country` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `birth_place` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `client_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `client_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `client_type` enum('INDIVIDUAL','CORPORATE','INSTITUTIONAL') COLLATE utf8mb4_unicode_ci NOT NULL,
  `declaration_date` date DEFAULT NULL,
  `last_review_date` date DEFAULT NULL,
  `next_review_date` date DEFAULT NULL,
  `reporting_required` bit(1) DEFAULT NULL,
  `risk_level` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tax_residence_country` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `us_address` bit(1) DEFAULT NULL,
  `us_person` bit(1) DEFAULT NULL,
  `us_phone` bit(1) DEFAULT NULL,
  `us_tin` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `w8_form_received` bit(1) DEFAULT NULL,
  `w9_form_received` bit(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cli` (`cli`),
  KEY `idx_fatca_clients_cli` (`cli`),
  KEY `idx_fatca_clients_status` (`fatca_status`),
  KEY `idx_fatca_clients_pays_naissance` (`pays_naissance`),
  KEY `idx_fatca_clients_nationalite` (`nationalite`),
  KEY `idx_fatca_clients_pays_adresse` (`pays_adresse`),
  KEY `idx_fatca_client_type` (`client_type`),
  KEY `idx_fatca_status` (`fatca_status`),
  KEY `idx_fatca_agency` (`agency_code`),
  KEY `idx_fatca_risk_level` (`risk_level`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fatca_clients`
--

LOCK TABLES `fatca_clients` WRITE;
/*!40000 ALTER TABLE `fatca_clients` DISABLE KEYS */;
INSERT INTO `fatca_clients` VALUES (1,'CLI000006','SMITH John','2020-01-15','Client Actif','US','US','123 Broadway, New York','US','+12125551234',NULL,NULL,'PENDING_REVIEW',NULL,NULL,NULL,'2026-01-04 18:57:09','2026-01-05 03:07:31','',NULL,NULL,NULL,'','','INDIVIDUAL',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(2,'CLI000007','JOHNSON Sarah','2021-06-20','Client Actif','US','US','456 Michigan Ave, Chicago','US','+13125559876',NULL,NULL,'PENDING_REVIEW',NULL,NULL,NULL,'2026-01-04 18:57:09','2026-01-05 03:07:31','',NULL,NULL,NULL,'','','INDIVIDUAL',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(3,'ENT000004','US COMPANY','2008-03-10','Client Actif',NULL,NULL,'789 Wall Street, New York','US','+12125557890',NULL,NULL,'PENDING_REVIEW',NULL,NULL,NULL,'2026-01-04 18:57:09','2026-01-05 03:07:31','',NULL,NULL,NULL,'','','INDIVIDUAL',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `fatca_clients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `kpis`
--

DROP TABLE IF EXISTS `kpis`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kpis` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `agency_code` varchar(255) DEFAULT NULL,
  `avg_resolution_time_hours` double DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `kpi_type` varchar(255) NOT NULL,
  `kpi_value` double NOT NULL,
  `period_date` date NOT NULL,
  `target_value` double DEFAULT NULL,
  `tickets_closed` int DEFAULT NULL,
  `tickets_sla_breached` int DEFAULT NULL,
  `tickets_sla_respected` int DEFAULT NULL,
  `tickets_total` int DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kpis`
--

LOCK TABLES `kpis` WRITE;
/*!40000 ALTER TABLE `kpis` DISABLE KEYS */;
INSERT INTO `kpis` VALUES (1,'GLOBAL',0,'2026-01-06 01:00:00.300425','CLOSURE_RATE',0,'2026-01-05',95,0,0,0,0,'2026-01-06 01:00:00.300425'),(2,'GLOBAL',0,'2026-01-06 01:00:00.537013','SLA_COMPLIANCE',0,'2026-01-05',90,0,0,0,0,'2026-01-06 01:00:00.537524'),(3,'GLOBAL',0,'2026-01-06 01:00:00.585236','AVG_RESOLUTION_TIME',0,'2026-01-05',48,0,0,0,0,'2026-01-06 01:00:00.585236');
/*!40000 ALTER TABLE `kpis` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rpa_jobs`
--

DROP TABLE IF EXISTS `rpa_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rpa_jobs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `action` varchar(255) NOT NULL,
  `completed_at` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `error_message` text,
  `job_id` varchar(255) NOT NULL,
  `process_instance_id` varchar(255) DEFAULT NULL,
  `result_data` text,
  `retry_count` int DEFAULT NULL,
  `started_at` datetime(6) DEFAULT NULL,
  `status` varchar(255) NOT NULL,
  `ticket_id` bigint NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_thf5l00ymnb04cn0loj5qxvmn` (`job_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rpa_jobs`
--

LOCK TABLES `rpa_jobs` WRITE;
/*!40000 ALTER TABLE `rpa_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `rpa_jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket_comments`
--

DROP TABLE IF EXISTS `ticket_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ticket_comments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `comment` text NOT NULL,
  `comment_type` varchar(20) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `is_internal` bit(1) DEFAULT NULL,
  `ticket_id` bigint NOT NULL,
  `user_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKdoce3fj1osdn71h25dhfs160v` (`ticket_id`),
  KEY `FKqstmdduoeqr1bm2lj8r5tmhl2` (`user_id`),
  CONSTRAINT `FKdoce3fj1osdn71h25dhfs160v` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`),
  CONSTRAINT `FKqstmdduoeqr1bm2lj8r5tmhl2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_comments`
--

LOCK TABLES `ticket_comments` WRITE;
/*!40000 ALTER TABLE `ticket_comments` DISABLE KEYS */;
/*!40000 ALTER TABLE `ticket_comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket_documents`
--

DROP TABLE IF EXISTS `ticket_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ticket_documents` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `document_name` varchar(255) NOT NULL,
  `document_path` varchar(500) NOT NULL,
  `document_type` varchar(50) DEFAULT NULL,
  `file_size` int DEFAULT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `uploaded_at` datetime(6) NOT NULL,
  `ticket_id` bigint NOT NULL,
  `uploaded_by` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKfyeobg7t725e0dqgyht1ghujs` (`ticket_id`),
  KEY `FK5vahcw98gtjdhm4l2xlaon12b` (`uploaded_by`),
  CONSTRAINT `FK5vahcw98gtjdhm4l2xlaon12b` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`),
  CONSTRAINT `FKfyeobg7t725e0dqgyht1ghujs` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_documents`
--

LOCK TABLES `ticket_documents` WRITE;
/*!40000 ALTER TABLE `ticket_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `ticket_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket_history`
--

DROP TABLE IF EXISTS `ticket_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ticket_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `action` varchar(100) NOT NULL,
  `new_status` enum('DETECTED','ASSIGNED','IN_PROGRESS','PENDING_VALIDATION','VALIDATED','UPDATED_CBS','CLOSED','REJECTED') DEFAULT NULL,
  `new_value` text,
  `notes` text,
  `previous_status` enum('DETECTED','ASSIGNED','IN_PROGRESS','PENDING_VALIDATION','VALIDATED','UPDATED_CBS','CLOSED','REJECTED') DEFAULT NULL,
  `previous_value` text,
  `timestamp` datetime(6) NOT NULL,
  `performed_by` int NOT NULL,
  `ticket_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKfiow7btiippxhu969xdwmfuou` (`performed_by`),
  KEY `FKkkhg6aquudxfcbofalx8rtc6v` (`ticket_id`),
  CONSTRAINT `FKfiow7btiippxhu969xdwmfuou` FOREIGN KEY (`performed_by`) REFERENCES `users` (`id`),
  CONSTRAINT `FKkkhg6aquudxfcbofalx8rtc6v` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_history`
--

LOCK TABLES `ticket_history` WRITE;
/*!40000 ALTER TABLE `ticket_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `ticket_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket_incidents`
--

DROP TABLE IF EXISTS `ticket_incidents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ticket_incidents` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `category` varchar(50) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `field_label` varchar(100) DEFAULT NULL,
  `field_name` varchar(50) NOT NULL,
  `incident_type` varchar(50) NOT NULL,
  `new_value` text,
  `notes` text,
  `old_value` text,
  `resolved` bit(1) NOT NULL,
  `resolved_at` datetime(6) DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `ticket_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKe4pown0wlaj02039c9lvsbejw` (`ticket_id`),
  CONSTRAINT `FKe4pown0wlaj02039c9lvsbejw` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_incidents`
--

LOCK TABLES `ticket_incidents` WRITE;
/*!40000 ALTER TABLE `ticket_incidents` DISABLE KEYS */;
/*!40000 ALTER TABLE `ticket_incidents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tickets`
--

DROP TABLE IF EXISTS `tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tickets` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `agency_code` varchar(5) NOT NULL,
  `assigned_at` datetime(6) DEFAULT NULL,
  `cli` varchar(15) NOT NULL,
  `client_name` varchar(200) DEFAULT NULL,
  `client_type` varchar(1) DEFAULT NULL,
  `closed_at` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `priority` enum('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL,
  `resolved_incidents` int DEFAULT NULL,
  `sla_breached` bit(1) DEFAULT NULL,
  `sla_deadline` datetime(6) DEFAULT NULL,
  `status` enum('DETECTED','ASSIGNED','IN_PROGRESS','PENDING_VALIDATION','VALIDATED','UPDATED_CBS','CLOSED','REJECTED') NOT NULL,
  `ticket_number` varchar(50) NOT NULL,
  `total_incidents` int DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `validated_at` datetime(6) DEFAULT NULL,
  `assigned_by` int DEFAULT NULL,
  `assigned_to` int DEFAULT NULL,
  `closed_by` int DEFAULT NULL,
  `validated_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_4ks48wgrew48dpkh0wd1rbe2b` (`ticket_number`),
  KEY `FKe8sjfncw99u9isfyab3xlk499` (`assigned_by`),
  KEY `FKmwsov8q6vll6krbx1co2ifp6t` (`assigned_to`),
  KEY `FKb5og2vu5sundwphri47gb6qcd` (`closed_by`),
  KEY `FK66yo3vj7xegxqxa9l31ucfyta` (`validated_by`),
  CONSTRAINT `FK66yo3vj7xegxqxa9l31ucfyta` FOREIGN KEY (`validated_by`) REFERENCES `users` (`id`),
  CONSTRAINT `FKb5og2vu5sundwphri47gb6qcd` FOREIGN KEY (`closed_by`) REFERENCES `users` (`id`),
  CONSTRAINT `FKe8sjfncw99u9isfyab3xlk499` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`),
  CONSTRAINT `FKmwsov8q6vll6krbx1co2ifp6t` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tickets`
--

LOCK TABLES `tickets` WRITE;
/*!40000 ALTER TABLE `tickets` DISABLE KEYS */;
/*!40000 ALTER TABLE `tickets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_audit_log`
--

DROP TABLE IF EXISTS `user_audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_audit_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `details` text COLLATE utf8mb4_unicode_ci,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_audit_user_id` (`user_id`),
  KEY `idx_user_audit_created_at` (`created_at`),
  CONSTRAINT `user_audit_log_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_audit_log`
--

LOCK TABLES `user_audit_log` WRITE;
/*!40000 ALTER TABLE `user_audit_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_audit_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_as_cs NOT NULL,
  `department` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `agency_code` varchar(5) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_as_cs NOT NULL,
  `last_login` timestamp NULL DEFAULT NULL,
  `failed_login_attempts` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `ldap_dn` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_username` (`username`),
  KEY `idx_users_email` (`email`),
  KEY `idx_users_agency_code` (`agency_code`),
  KEY `idx_users_role` (`role`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','admin@bdm-sa.com','$2y$10$CPjBEjqTeYlnlBSsJ7i/GeCenUcgKE3PdehOngg2uw57Db4dfsVc.','Administrateur Système','ADMIN','Administration',NULL,'ACTIVE','2026-01-06 04:51:16',0,'2026-01-04 18:57:09','2026-01-06 04:51:16',NULL),(2,'auditor','auditor@bdm-sa.com','$2a$10$44HY22l7WAnUUpLGddS5ZujBtaBD4bYg33qCccCmwDavuEO9xiJzi','Auditeur Principal','auditor','Audit',NULL,'ACTIVE',NULL,0,'2026-01-04 18:57:09','2026-01-06 02:07:48',NULL),(3,'user','user@bdm-sa.com','$2a$10$44HY22l7WAnUUpLGddS5ZujBtaBD4bYg33qCccCmwDavuEO9xiJzi','Utilisateur Standard','user','Opérations',NULL,'ACTIVE',NULL,0,'2026-01-04 18:57:09','2026-01-06 02:07:48',NULL),(4,'agency_01001','agence.01001@bdm-sa.com','$2a$10$IJ3Jtnky3Oh9bgJZuIG81uxuM5Vc69Lzd7f9fOGKHM6KI6lPZOTEG','Utilisateur Agence Ganhi','agency_user','Agence','01001','ACTIVE',NULL,0,'2026-01-04 18:57:09','2026-01-06 02:07:48',NULL),(5,'agency_01002','agence.01002@bdm-sa.com','$2a$10$Db2TPk1Py6FlCYoYDCkNruqw.Aa9EZVY9WNoMCIAj0TzG1gGIapKS','Utilisateur Agence Haie Vive','agency_user','Agence','01002','ACTIVE',NULL,0,'2026-01-04 18:57:09','2026-01-06 02:07:48',NULL),(6,'agency_01003','agence.01003@bdm-sa.com','$2a$10$3d13S7HqaqOdGjgoHOJh/uORofNjMwa0PtCqTUPyk4ElzJn16lhx2','Utilisateur Agence Cadjehoun','agency_user','Agence','01003','ACTIVE',NULL,0,'2026-01-04 18:57:09','2026-01-06 02:07:48',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `validation_rules`
--

DROP TABLE IF EXISTS `validation_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `validation_rules` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `active` bit(1) DEFAULT NULL,
  `client_type` enum('INDIVIDUAL','CORPORATE','INSTITUTIONAL') DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `description` text,
  `error_message` text,
  `field_name` varchar(255) NOT NULL,
  `priority` int DEFAULT NULL,
  `rule_name` varchar(255) NOT NULL,
  `rule_type` enum('REQUIRED','FORMAT','RANGE','REGEX','CUSTOM','CROSS_FIELD','DATABASE') NOT NULL,
  `severity` varchar(255) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `validation_expression` text,
  PRIMARY KEY (`id`),
  KEY `idx_rule_type` (`rule_type`),
  KEY `idx_rule_client_type` (`client_type`),
  KEY `idx_rule_active` (`active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `validation_rules`
--

LOCK TABLES `validation_rules` WRITE;
/*!40000 ALTER TABLE `validation_rules` DISABLE KEYS */;
/*!40000 ALTER TABLE `validation_rules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `vw_fatca_clients_by_indicia`
--

DROP TABLE IF EXISTS `vw_fatca_clients_by_indicia`;
/*!50001 DROP VIEW IF EXISTS `vw_fatca_clients_by_indicia`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_fatca_clients_by_indicia` AS SELECT 
 1 AS `indicia_type`,
 1 AS `client_count`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `vw_fatca_statistics`
--

DROP TABLE IF EXISTS `vw_fatca_statistics`;
/*!50001 DROP VIEW IF EXISTS `vw_fatca_statistics`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_fatca_statistics` AS SELECT 
 1 AS `total_clients`,
 1 AS `to_verify`,
 1 AS `confirmed`,
 1 AS `excluded`,
 1 AS `pending`,
 1 AS `current_month`*/;
SET character_set_client = @saved_cs_client;

--
-- Final view structure for view `vw_fatca_clients_by_indicia`
--

/*!50001 DROP VIEW IF EXISTS `vw_fatca_clients_by_indicia`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_fatca_clients_by_indicia` AS select 'Lieu de naissance US' AS `indicia_type`,count(0) AS `client_count` from `fatca_clients` where (`fatca_clients`.`pays_naissance` = 'US') union all select 'Nationalité US' AS `indicia_type`,count(0) AS `client_count` from `fatca_clients` where (`fatca_clients`.`nationalite` = 'US') union all select 'Adresse US' AS `indicia_type`,count(0) AS `client_count` from `fatca_clients` where (`fatca_clients`.`pays_adresse` = 'US') union all select 'Téléphone US' AS `indicia_type`,count(0) AS `client_count` from `fatca_clients` where ((`fatca_clients`.`telephone` like '+1%') or (`fatca_clients`.`telephone` like '001%')) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `vw_fatca_statistics`
--

/*!50001 DROP VIEW IF EXISTS `vw_fatca_statistics`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_fatca_statistics` AS select count(0) AS `total_clients`,sum((case when (`fatca_clients`.`fatca_status` = 'À vérifier') then 1 else 0 end)) AS `to_verify`,sum((case when (`fatca_clients`.`fatca_status` = 'Confirmé') then 1 else 0 end)) AS `confirmed`,sum((case when (`fatca_clients`.`fatca_status` = 'Exclu') then 1 else 0 end)) AS `excluded`,sum((case when (`fatca_clients`.`fatca_status` = 'En attente') then 1 else 0 end)) AS `pending`,sum((case when (`fatca_clients`.`created_at` >= date_format(curdate(),'%Y-%m-01')) then 1 else 0 end)) AS `current_month` from `fatca_clients` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-07 23:59:14
