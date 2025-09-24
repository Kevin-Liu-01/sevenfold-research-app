// src/pages/PrivacyPolicy.tsx
import React from "react";
import LegalLayout from "@/components/legal";

const PrivacyPolicy: React.FC = () => (
    <LegalLayout
        pageKey="privacy"
        title="Sevenfold Inc. Privacy Policy"
        updated="June 29, 2025"
    >
        <p>
            This Privacy Policy describes how <strong>Sevenfold Inc.</strong>{" "}
            (“we”, “us”, “our”) collects, uses, and discloses information about
            individuals who use our websites (
            <a href="https://www.sevenfold.so">sevenfold.so</a> and{" "}
            <a href="https://labs.sevenfold.so">labs.sevenfold.so</a>), other
            applications, services, tools and features, or who purchase our
            products or otherwise interact with us (collectively, the
            “Services”). For the purposes of this Privacy Policy, we are the
            data controller, and “you” means you as the user of the Services.
        </p>

        <h3>1. Information We Collect</h3>
        <p>
            <strong>a) Information You Give Us:</strong> account registration
            details (name, email), profile information, payment info if you
            purchase Pro, support tickets, survey responses.
        </p>
        <p>
            <strong>b) Automatically Collected:</strong> log data (pages viewed,
            features used), device data (IP address, browser type, OS), cookies
            and similar tracking technologies.
        </p>

        <h3>2. How We Use Your Information</h3>
        <ul>
            <li>Operate, maintain, and improve the Services</li>
            <li>Personalize your experience and recommend content</li>
            <li>Process transactions and send you related information</li>
            <li>Communicate product updates, marketing, and security alerts</li>
        </ul>

        <h3>3. Sharing & Disclosure</h3>
        <p>We do not sell your personal data. We may share it with:</p>
        <ul>
            <li>
                Third-party service providers (hosting, analytics, payments)
            </li>
            <li>Affiliates and subsidiaries under common control</li>
            <li>When required by law (e.g., subpoenas, court orders)</li>
        </ul>

        <h3>4. Cookies & Tracking</h3>
        <p>
            We use cookies, local storage, and analytics (e.g., Google
            Analytics) to understand usage patterns and remember preferences.
            You can opt out via your browser settings.
        </p>

        <h3>5. Your Rights</h3>
        <p>
            Depending on your jurisdiction, you may have rights to access,
            correct, delete, or restrict use of your personal data. To exercise
            these rights, please contact us at{" "}
            <a href="mailto:privacy@sevenfold.so">privacy@sevenfold.so</a>.
        </p>

        <h3>6. Changes to This Policy</h3>
        <p>
            We may update this policy from time to time. If we make material
            changes, we will notify you via email or in-app notice at least 30
            days before they become effective.
        </p>
    </LegalLayout>
);

export default PrivacyPolicy;
