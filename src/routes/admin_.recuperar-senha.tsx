import { createFileRoute } from '@tanstack/react-router';
import Page from '@/views/saas/PasswordRecovery';
export const Route = createFileRoute('/admin_/recuperar-senha')({ component: Page });
