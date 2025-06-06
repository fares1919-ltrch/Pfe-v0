# Biometric Data Collection Process

This document details the biometric data collection process implemented in the CPF System, including data types, quality standards, and security considerations.

## Overview

Biometric data collection is a critical component of the CPF issuance process, ensuring the uniqueness and security of each CPF credential. The system collects multiple biometric identifiers to establish a comprehensive digital identity for each citizen.

## Types of Biometric Data

### 1. Fingerprints

The system collects fingerprint data from all ten fingers:

- **Right Hand**: Thumb, Index, Middle, Ring, and Little fingers
- **Left Hand**: Thumb, Index, Middle, Ring, and Little fingers

**Technical Specifications:**

- **Resolution**: Minimum 500 DPI
- **Format**: WSQ (Wavelet Scalar Quantization) or JPEG2000
- **Quality Threshold**: NFIQ 2.0 score of 60 or higher
- **Capture Device**: FBI-certified fingerprint scanner

### 2. Facial Biometrics

A high-quality facial photograph is captured following international standards:

**Technical Specifications:**

- **Resolution**: Minimum 600x800 pixels
- **Format**: JPEG or PNG
- **Background**: Uniform, light-colored
- **Expression**: Neutral expression, both eyes open
- **Lighting**: Even lighting without shadows
- **Attributes Validation**:
  - No head coverings (except for religious purposes)
  - No glasses (if possible)
  - Face centered in frame

### 3. Iris Scan (Optional)

For enhanced security, iris scans may be collected:

**Technical Specifications:**

- **Format**: ISO/IEC 19794-6 compliant
- **Resolution**: Minimum 640x480 pixels
- **Capture**: Both left and right iris
- **Quality**: Sufficient contrast between iris and pupil

### 4. Signature

Digital signature capture:

**Technical Specifications:**

- **Resolution**: Minimum 300 DPI
- **Format**: Vector or high-quality raster
- **Capture**: On digital signing pad

## Collection Process

```
┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│                   │     │                   │     │                   │
│  Identity         │────►│  Fingerprint      │────►│  Facial           │
│  Verification     │     │  Collection       │     │  Photograph       │
│                   │     │                   │     │                   │
└───────────────────┘     └───────────────────┘     └─────────┬─────────┘
                                                              │
                                                              │
                                                              ▼
┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│                   │     │                   │     │                   │
│  Data Quality     │◄────┤  Signature        │◄────┤  Iris Scan        │
│  Verification     │     │  Capture          │     │  (if applicable)  │
│                   │     │                   │     │                   │
└─────────┬─────────┘     └───────────────────┘     └───────────────────┘
          │
          │
          ▼
┌───────────────────┐     ┌───────────────────┐
│                   │     │                   │
│  Secure           │────►│  Biometric        │
│  Storage          │     │  Registration     │
│                   │     │                   │
└───────────────────┘     └───────────────────┘
```

### Step 1: Preparation

1. **Officer Login**: Officer logs into the biometric collection module with secure credentials
2. **Identity Verification**: Officer verifies the citizen's identity using government-issued ID
3. **System Setup**: Verification of all biometric capture devices

### Step 2: Data Collection

1. **Fingerprint Capture**:

   - Each finger is captured individually
   - Quality check performed in real-time
   - Recapture if quality threshold not met

2. **Facial Photograph**:

   - Proper positioning and lighting check
   - Multiple captures to select best quality
   - Automatic compliance check with standards

3. **Iris Scan** (if applicable):

   - Capture of both irises
   - Quality verification

4. **Signature Capture**:
   - Digital signature on electronic pad
   - Multiple attempts allowed if needed

### Step 3: Quality Verification

Each biometric sample undergoes real-time quality assessment:

1. **Fingerprint Quality Check**:

   - NFIQ (NIST Fingerprint Image Quality) scoring
   - Ridge clarity and minutiae count verification
   - Sufficient area coverage

2. **Facial Image Quality Check**:

   - Face detection and positioning
   - Lighting and contrast verification
   - Expression and eye openness check

3. **Iris Quality Check**:
   - Clarity and focus verification
   - Sufficient iris area visible
   - Minimal occlusion by eyelids

### Step 4: Data Storage and Association

1. **Encryption**: All biometric data is encrypted immediately upon capture
2. **Association**: Data is associated with the user's appointment
3. **Metadata Recording**: Collection environment and device information recorded
4. **Verification Status**: Initial verification status set to "pending"

## Quality Standards

### Fingerprint Quality

| Quality Level | NFIQ 2.0 Score | Action                             |
| ------------- | -------------- | ---------------------------------- |
| Excellent     | 80-100         | Proceed                            |
| Good          | 60-79          | Proceed                            |
| Fair          | 40-59          | Recapture recommended              |
| Poor          | 20-39          | Recapture required                 |
| Very Poor     | 0-19           | Multiple recaptures and escalation |

### Facial Image Quality

| Criteria      | Requirement           | Validation Method               |
| ------------- | --------------------- | ------------------------------- |
| Resolution    | Min 600x800 pixels    | Automated pixel count           |
| Face Coverage | 70-80% of frame       | Automated face detection        |
| Expression    | Neutral               | AI-based expression analysis    |
| Eyes          | Both visible and open | Eye detection algorithm         |
| Lighting      | Even illumination     | Histogram analysis              |
| Background    | Uniform, no shadows   | Background uniformity detection |
| Head Position | Straight, no tilt     | Face orientation detection      |

## Supporting Documents

In addition to biometric data, the following supporting documents may be digitized:

1. **Identity Card**: High-resolution scan of official ID
2. **Proof of Address**: Utility bill or official correspondence
3. **Birth Certificate**: For first-time CPF applicants
4. **Foreign Documentation**: For non-citizens (if applicable)

## Verification Process

After collection, biometric data undergoes a verification process:

1. **Duplicate Check**: Comparison against existing database to prevent fraud
2. **Quality Assurance**: Secondary quality review by automated system
3. **Deduplication**: Ensuring uniqueness across the database
4. **Confirmation**: Final verification by officer

## Security Measures

### Data Protection

1. **Encryption**: AES-256 encryption for all stored biometric data
2. **Access Control**: Role-based access with strict permissions
3. **Segmentation**: Separation of biometric data from personal identifiers
4. **Data Minimization**: Only necessary data is collected and stored

### Compliance

The biometric collection system complies with:

1. **LGPD**: Brazilian General Data Protection Law requirements
2. **ISO/IEC 19794-x**: International biometric data interchange formats
3. **ICAO 9303**: International standards for travel documents

### Audit and Monitoring

1. **Collection Logs**: Detailed logs of all biometric collection activities
2. **Access Logs**: Records of all access to biometric data
3. **Quality Metrics**: Ongoing monitoring of collection quality

## Special Considerations

### Accessibility

1. **Physical Disabilities**: Alternative procedures for individuals unable to provide certain biometrics
2. **Temporary Conditions**: Provisions for temporary issues (e.g., bandaged fingers)
3. **Age Considerations**: Adapted procedures for elderly or very young citizens

### Privacy Protections

1. **Consent**: Clear explanation and consent process before biometric collection
2. **Purpose Limitation**: Data used only for CPF issuance and validation
3. **Retention Policy**: Clear policies on data retention and deletion
4. **Subject Rights**: Mechanisms for citizens to access information about their data

## Technical Implementation

The biometric data collection module integrates with the following system components:

1. **Device Integration**: API for biometric capture devices
2. **Quality Assessment**: Real-time quality evaluation algorithms
3. **Storage**: Secure database with encryption and access controls
4. **Verification**: Matching algorithms for deduplication and verification
