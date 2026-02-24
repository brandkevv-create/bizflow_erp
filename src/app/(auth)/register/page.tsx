import { AuthLayout } from "@/features/auth/components/auth-layout";
import { RegisterForm } from "@/features/auth/components/register-form";

export default function RegisterPage() {
    return (
        <AuthLayout
            heading="Create an account"
            description="Get started with BizFlow ERP today"
            backButtonLabel="Already have an account? Sign in"
            backButtonHref="/login"
        >
            <RegisterForm />
        </AuthLayout>
    );
}
