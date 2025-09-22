// src/pages/TermsAndConditions.tsx
import React from "react";
import LegalLayout from "@/components/legal";

const TermsAndConditions: React.FC = () => (
    <LegalLayout
        pageKey="user"
        title="Platform User Terms"
        updated="June 29, 2025"
    >
        <p>
            These Terms &amp; Conditions (“Terms”) govern your access to and use
            of the sevenfold.so and labs.sevenfold.so platform (the “Service”). By
            accessing or using the Service, you agree to be bound by these
            Terms.
        </p>

        <h3>1. Using Our Service</h3>
        <p>
            You may use the Service only in compliance with these Terms and all
            applicable laws. Do not reverse engineer, abuse, or interfere with
            the Service.
        </p>

        <h3>2. Account Responsibilities</h3>
        <p>
            You’re responsible for maintaining the confidentiality of your
            account credentials. Notify us immediately of any unauthorized use.
        </p>

        <h3>3. Intellectual Property</h3>
        <p>
            All content, trademarks, and software underlying our Service are
            owned by <strong>Sevenfold Inc.</strong> or its licensors. We grant
            you a limited, revocable, non-exclusive license to use the Service
            in accordance with these Terms.
        </p>

        <h3>4. Prohibited Conduct</h3>
        <ul>
            <li>Uploading harmful or infringing content</li>
            <li>Attempting unauthorized access to our systems</li>
            <li>Interfering with other users’ use of the Service</li>
        </ul>

        <h3>5. Disclaimers &amp; Limitation of Liability</h3>
        <p>
            THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE” WITHOUT
            WARRANTIES OF ANY KIND. TO THE MAXIMUM EXTENT PERMITTED BY LAW,{" "}
            <strong>SEVENFOLD INC.</strong>’S LIABILITY IS LIMITED TO DIRECT
            DAMAGES NOT EXCEEDING U.S. $100.
        </p>

        <h3>6. Governing Law</h3>
        <p>
            These Terms are governed by the laws of the State of California,
            excluding its conflicts-of-law rules.
        </p>

        <h3>7. Changes to Terms</h3>
        <p>
            We may revise these Terms from time to time. We’ll notify you of
            material changes by email or in-app notification.
        </p>

        <h3>8. Contact Us</h3>
        <p>
            If you have questions about these Terms, please email{" "}
            <a href="mailto:legal@sevenfold.so">legal@sevenfold.so</a>.
        </p>
    </LegalLayout>
);

export default TermsAndConditions;
