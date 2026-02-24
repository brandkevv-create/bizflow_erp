import { AuthLayout } from "@/features/auth/components/auth-layout";
import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
    return (
        <AuthLayout
            heading="Welcome back"
            description="Sign in to your account to continue"
            backButtonLabel="Don't have an account? Sign up"
            backButtonHref="/register"
        >
            <LoginForm />
        </AuthLayout>
    );
}
