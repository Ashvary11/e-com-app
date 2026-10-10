import Container from "@/components/layout/Container";

function PrivacyPolicy() {
  return (
    <Container className="py-10">
      <article className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">
            Last updated: October 8, 2026
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. Information We Collect</h2>
          <p>
            CartSphere may collect information such as your name, email address,
            account information, order information, cart information, and
            information you provide when contacting us.
          </p>
          <p>
            If you use Google Sign-In, we may receive your name, email address,
            profile picture, and Google account identifier to create or
            authenticate your CartSphere account.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            2. How We Use Your Information
          </h2>
          <p>We use your information to:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>Create and manage your CartSphere account.</li>
            <li>Authenticate your identity and secure your account.</li>
            <li>Process and manage orders.</li>
            <li>Maintain your shopping cart.</li>
            <li>Provide customer support.</li>
            <li>Send important account and order-related communications.</li>
            <li>Prevent fraud, abuse, and unauthorized access.</li>
            <li>Improve and maintain CartSphere.</li>
          </ul>
          <p>We do not sell your personal information to third parties.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. Google Sign-In</h2>
          <p>
            CartSphere may allow you to create or access your account using
            Google Sign-In.
          </p>
          <p>
            When you use Google Sign-In, Google provides information necessary
            to authenticate your account. This information is used for account
            creation, authentication, account management, and related
            functionality.
          </p>
          <p>
            Your use of Google services is also subject to Google's applicable
            policies and privacy practices.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            4. Cookies and Authentication
          </h2>
          <p>
            CartSphere uses cookies to maintain secure authentication sessions
            and provide access to your account.
          </p>
          <p>
            Authentication cookies are used for security and account
            functionality. CartSphere does not use authentication cookies to
            store your password.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. Orders and Payments</h2>
          <p>
            When you place an order, we may store information necessary to
            process and manage that order.
          </p>
          <p>
            Payment information may be processed by third-party payment
            providers. CartSphere does not intentionally store complete payment
            card details such as full card numbers or CVV information.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. Data Security</h2>
          <p>
            We use reasonable technical and organizational measures to protect
            your information from unauthorized access, alteration, disclosure,
            or destruction.
          </p>
          <p>
            However, no internet-based service can guarantee absolute security.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">7. Data Retention</h2>
          <p>
            We retain account, order, and related information for as long as
            reasonably necessary to provide our services, maintain business
            records, resolve disputes, prevent abuse, and comply with applicable
            legal obligations.
          </p>
          <p>
            You may request deletion of your CartSphere account where
            applicable.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">8. Your Rights</h2>
          <p>Depending on applicable law, you may have the right to:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>Access your personal information.</li>
            <li>Correct inaccurate information.</li>
            <li>Request deletion of your account.</li>
            <li>Request information about how your data is used.</li>
            <li>Withdraw consent where applicable.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">9. Third-Party Services</h2>
          <p>
            CartSphere may use third-party services for authentication, payment
            processing, email delivery, hosting, analytics, or other
            infrastructure.
          </p>
          <p>
            These services may process information according to their own
            privacy policies.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">10. Children's Privacy</h2>
          <p>
            CartSphere is not intended for children below the minimum age
            required to use online services under applicable law. We do not
            knowingly collect personal information from children in violation of
            applicable legal requirements.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            11. Changes to This Privacy Policy
          </h2>
          <p>
            We may update this Privacy Policy from time to time. Updated
            versions will be posted on this page with a revised "Last updated"
            date.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">12. Contact Us</h2>
          <p>
            If you have questions or concerns about this Privacy Policy or how
            your information is handled, please contact CartSphere through the
            contact information provided on our website.
          </p>
        </section>
      </article>
    </Container>
  );
}

export default PrivacyPolicy;
