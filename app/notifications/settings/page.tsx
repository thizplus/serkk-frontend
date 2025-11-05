"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layouts/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Field, FieldLabel } from "@/components/ui/field";
import { Loader2, ArrowLeft, Bell, MessageSquare, Heart, UserPlus, Mail } from "lucide-react";
import {
  useNotificationSettings,
  useUpdateNotificationSettings
} from "@/lib/hooks/queries/useNotifications";

export default function NotificationSettingsPage() {
  const router = useRouter();

  // Fetch current settings
  const { data: settings, isLoading, error } = useNotificationSettings();

  // Update mutation
  const updateSettings = useUpdateNotificationSettings();

  // Local state for form
  const [replies, setReplies] = useState(false);
  const [mentions, setMentions] = useState(false);
  const [votes, setVotes] = useState(false);
  const [follows, setFollows] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(false);

  // Initialize form with fetched settings
  useEffect(() => {
    if (settings) {
      setReplies(settings.replies);
      setMentions(settings.mentions);
      setVotes(settings.votes);
      setFollows(settings.follows);
      setEmailNotifications(settings.emailNotifications);
    }
  }, [settings]);

  // Loading state
  if (isLoading) {
    return (
      <AppLayout breadcrumbs={[{ label: "กำลังโหลด..." }]}>
        <Card>
          <CardContent className="py-16 text-center">
            <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">กำลังโหลดการตั้งค่า...</p>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  // Error state
  if (error || !settings) {
    return (
      <AppLayout
        breadcrumbs={[
          { label: "การแจ้งเตือน", href: "/notifications" },
          { label: "การตั้งค่า" },
        ]}
      >
        <Card>
          <CardContent className="text-center py-16">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">ไม่สามารถโหลดการตั้งค่าได้</h2>
            <p className="text-muted-foreground mb-6">
              {error instanceof Error ? error.message : 'เกิดข้อผิดพลาด'}
            </p>
            <Button onClick={() => router.push("/notifications")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              กลับไปหน้าการแจ้งเตือน
            </Button>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  const handleSave = () => {
    updateSettings.mutate({
      replies,
      mentions,
      votes,
      follows,
      emailNotifications,
    });
  };

  // Check if settings changed
  const hasChanges =
    replies !== settings.replies ||
    mentions !== settings.mentions ||
    votes !== settings.votes ||
    follows !== settings.follows ||
    emailNotifications !== settings.emailNotifications;

  return (
    <AppLayout
      breadcrumbs={[
        { label: "หน้าหลัก", href: "/" },
        { label: "การแจ้งเตือน", href: "/notifications" },
        { label: "การตั้งค่า" },
      ]}
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back Button */}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => router.push("/notifications")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          กลับ
        </Button>

        {/* Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              การตั้งค่าการแจ้งเตือน
            </CardTitle>
            <CardDescription>
              เลือกประเภทการแจ้งเตือนที่คุณต้องการรับ
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Replies Notification */}
            <Field>
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <FieldLabel>ความคิดเห็นตอบกลับ</FieldLabel>
                    <p className="text-sm text-muted-foreground">
                      แจ้งเตือนเมื่อมีคนตอบกลับโพสต์หรือความคิดเห็นของคุณ
                    </p>
                  </div>
                </div>
                <Switch
                  checked={replies}
                  onCheckedChange={setReplies}
                />
              </div>
            </Field>

            {/* Mentions Notification */}
            <Field>
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <span className="text-lg text-muted-foreground mt-0.5">@</span>
                  <div>
                    <FieldLabel>การกล่าวถึง</FieldLabel>
                    <p className="text-sm text-muted-foreground">
                      แจ้งเตือนเมื่อมีคนกล่าวถึงคุณในโพสต์หรือความคิดเห็น
                    </p>
                  </div>
                </div>
                <Switch
                  checked={mentions}
                  onCheckedChange={setMentions}
                />
              </div>
            </Field>

            {/* Votes Notification */}
            <Field>
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <Heart className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <FieldLabel>การโหวต</FieldLabel>
                    <p className="text-sm text-muted-foreground">
                      แจ้งเตือนเมื่อมีคนโหวตโพสต์หรือความคิดเห็นของคุณ
                    </p>
                  </div>
                </div>
                <Switch
                  checked={votes}
                  onCheckedChange={setVotes}
                />
              </div>
            </Field>

            {/* Follows Notification */}
            <Field>
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <UserPlus className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <FieldLabel>ผู้ติดตาม</FieldLabel>
                    <p className="text-sm text-muted-foreground">
                      แจ้งเตือนเมื่อมีคนติดตามคุณ
                    </p>
                  </div>
                </div>
                <Switch
                  checked={follows}
                  onCheckedChange={setFollows}
                />
              </div>
            </Field>

            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">การแจ้งเตือนทางอีเมล</h3>

              {/* Email Notifications */}
              <Field>
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <FieldLabel>รับการแจ้งเตือนทางอีเมล</FieldLabel>
                      <p className="text-sm text-muted-foreground">
                        รับสรุปการแจ้งเตือนทางอีเมลเป็นระยะ
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
              </Field>
            </div>

            {/* Save Button */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSave}
                disabled={!hasChanges || updateSettings.isPending}
                className="flex-1"
              >
                {updateSettings.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {updateSettings.isPending ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/notifications")}
                disabled={updateSettings.isPending}
              >
                ยกเลิก
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
