'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useRegister, useGoogleOAuthUrl } from '../hooks/useAuth';
import Link from 'next/link';
import { toast } from 'sonner';
import { TOAST_MESSAGES } from '@/shared/config';

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const registerMutation = useRegister();
  const googleOAuthUrl = useGoogleOAuthUrl();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!email || !username || !password || !confirmPassword) {
      toast.error(TOAST_MESSAGES.AUTH.REQUIRED_FIELDS);
      return;
    }

    if (password.length < 8) {
      toast.error(TOAST_MESSAGES.AUTH.PASSWORD_TOO_SHORT);
      return;
    }

    if (password !== confirmPassword) {
      toast.error(TOAST_MESSAGES.AUTH.PASSWORD_MISMATCH);
      return;
    }

    registerMutation.mutate({
      email,
      username,
      password,
      displayName: displayName || username,
    });
  };

  const handleGoogleRegister = () => {
    googleOAuthUrl.mutate();
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">สร้างบัญชีใหม่</CardTitle>
          <CardDescription>
            กรุณากรอกข้อมูลเพื่อสร้างบัญชีของคุณ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <Button
                  variant="outline"
                  type="button"
                  onClick={handleGoogleRegister}
                  disabled={googleOAuthUrl.isPending || registerMutation.isPending}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  {googleOAuthUrl.isPending
                    ? 'กำลังเชื่อมต่อกับ Google...'
                    : 'ลงทะเบียนด้วยบัญชี Google'}
                </Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                หรือต่อด้วย
              </FieldSeparator>
              <Field>
                <FieldLabel htmlFor="username">ชื่อผู้ใช้</FieldLabel>
                <Input
                  id="username"
                  type="text"
                  placeholder="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={registerMutation.isPending}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="displayName">
                  ชื่อที่แสดง (ไม่บังคับ)
                </FieldLabel>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Display Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={registerMutation.isPending}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">อีเมล</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={registerMutation.isPending}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">รหัสผ่าน</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={registerMutation.isPending}
                />
                <FieldDescription>
                  รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="confirm-password">
                  ยืนยันรหัสผ่าน
                </FieldLabel>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={registerMutation.isPending}
                />
              </Field>
              <Field>
                <Button type="submit" disabled={registerMutation.isPending}>
                  {registerMutation.isPending ? 'กำลังสร้างบัญชี...' : 'สร้างบัญชี'}
                </Button>
                <FieldDescription className="text-center">
                  มีบัญชีอยู่แล้วใช่ไหม?{' '}
                  <Link href="/login" className="underline">
                    เข้าสู่ระบบ
                  </Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        เมื่อคลิกสร้างบัญชี แสดงว่าคุณยอมรับ
        <a href="#" className="underline">
          ข้อกำหนดในการให้บริการ
        </a>{' '}
        และ
        <a href="#" className="underline">
          นโยบายความเป็นส่วนตัว
        </a>
        ของเรา
      </FieldDescription>
    </div>
  );
}
