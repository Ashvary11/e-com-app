 
import Container from "@/components/layout/Container";

function TermsOfService() {
  return (
    <Container className="py-10">
      <article className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Terms of Service
          </h1>
          <p className="text-sm text-muted-foreground">
            Last updated: October 8, 2026
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. About CartSphere</h2>
          <p>
            CartSphere is an ecommerce platform that allows users to browse
            products, manage shopping carts, create accounts, and place orders.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. User Accounts</h2>
          <p>
            Some features require you to create a CartSphere account.
          </p>
          <p>You are responsible for:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>Providing accurate information.</li>
            <li>Keeping your account information up to date.</li>
            <li>Keeping your login credentials secure.</li>
            <li>Maintaining the security of your account.</li>
            <li>Preventing unauthorized use of your account.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. Google Sign-In</h2>
          <p>
            CartSphere may allow you to create or access an account using
            Google Sign-In.
          </p>
          <p>
            When using Google Sign-In, you must comply with Google's applicable
            terms and policies.
          </p>
          <p>
            If a CartSphere account already exists with the same verified
            email address, the Google account may be linked to that existing
            CartSphere account.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            4. Products and Pricing
          </h2>
          <p>
            We make reasonable efforts to keep product information,
            descriptions, prices, availability, and images accurate.
          </p>
          <p>
            However, product information may occasionally contain errors or
            become outdated. We reserve the right to correct errors, update
            information, change prices, or modify product availability.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. Orders</h2>
          <p>
            Submitting an order does not necessarily guarantee acceptance of
            the order.
          </p>
          <p>
            We may reject or cancel an order when reasonably necessary,
            including because of product availability, pricing errors,
            suspected fraud, payment problems, or technical issues.
          </p>
          <p>
            If an order is cancelled after payment has been received, any
            applicable refund will be handled according to the applicable
            payment provider and CartSphere's refund procedures.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. Payments</h2>
          <p>
            Payments may be processed through third-party payment providers.
          </p>
          <p>
            You agree to provide accurate information required to complete a
            transaction. Payment providers may have their own terms and
            privacy policies.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">7. Prohibited Use</h2>
          <p>You must not use CartSphere to:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>Commit fraud or engage in unlawful activity.</li>
            <li>Attempt to gain unauthorized access to accounts or systems.</li>
            <li>Interfere with the operation or security of CartSphere.</li>
            <li>Upload malicious software or harmful content.</li>
            <li>Abuse promotions, discounts, or other features.</li>
            <li>Impersonate another person or entity.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">8. Intellectual Property</h2>
          <p>
            CartSphere and its associated software, design, branding, logos,
            content, and other materials are protected by applicable
            intellectual property laws.
          </p>
          <p>
            You may not copy, reproduce, modify, distribute, or commercially
            exploit CartSphere materials without appropriate authorization.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            9. Third-Party Services
          </h2>
          <p>
            CartSphere may integrate with third-party services, including
            authentication, payment, email, hosting, and other service
            providers.
          </p>
          <p>
            Your use of third-party services may also be subject to their own
            terms and policies.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            10. Account Suspension or Termination
          </h2>
          <p>
            We may suspend or terminate access to an account if we reasonably
            believe the account violates these Terms, is being used for
            fraudulent or abusive activity, creates a security risk, or is
            involved in unlawful activity.
          </p>
          <p>
            You may request deletion of your account where applicable.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">11. Disclaimer</h2>
          <p>
            CartSphere is provided on an "as available" basis. While we make
            reasonable efforts to maintain the service, we do not guarantee
            that CartSphere will always be available, uninterrupted,
            error-free, or completely secure.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            12. Limitation of Liability
          </h2>
          <p>
            To the extent permitted by applicable law, CartSphere and its
            operators will not be responsible for indirect, incidental,
            special, or consequential losses arising from the use of the
            service.
          </p>
          <p>
            Nothing in these Terms limits rights or protections that cannot
            legally be excluded under applicable law.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            13. Changes to These Terms
          </h2>
          <p>
            We may update these Terms of Service from time to time. Updated
            terms will be posted on this page with a revised "Last updated"
            date.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">14. Contact Us</h2>
          <p>
            If you have questions about these Terms of Service, please contact
            CartSphere through the contact information provided on our
            website.
          </p>
        </section>
      </article>
    </Container>
  );
}

export default TermsOfService;
 