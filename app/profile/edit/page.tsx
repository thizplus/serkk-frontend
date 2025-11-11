"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AppLayout from "@/components/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Camera, X, Loader2 } from "@/shared/config/icons";
import { toast } from "sonner";
import { useUser, useHasHydrated } from '@/features/auth';
import { TOAST_MESSAGES } from "@/shared/config";
import { useProfile } from "@/features/profile";
import { useUpdateProfile } from "@/features/profile";
import { useUploadImage } from "@/features/posts";

export const dynamic = 'force-dynamic';

export default function EditProfilePage() {
  const router = useRouter();
  const hasHydrated = useHasHydrated(); // ⭐ เช็คว่า Zustand hydrate เสร็จแล้วหรือยัง
  const currentUser = useUser(); // ดึง user จาก Zustand
  const { data: profileData, isLoading: isLoadingProfile } = useProfile(); // ดึงข้อมูล profile จาก API
  const updateProfileMutation = useUpdateProfile();
  const uploadImageMutation = useUploadImage(); // ⭐ สำหรับ upload รูปภาพ

  // ⭐ ใช้ profileData เป็น initial value โดยตรง
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [avatar, setAvatar] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [avatarFile, setAvatarFile] = useState<File | null>(null); // TODO: ใช้สำหรับ upload image

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const isFormInitializedRef = useRef(false); // ⭐ ใช้ ref แทน state

  // ⭐ Populate form data เมื่อ profile โหลดเสร็จ (ครั้งเดียว)
  // This is a valid use case: populating form from async data
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (profileData && !isFormInitializedRef.current) {
      setDisplayName(profileData.displayName || "");
      setBio(profileData.bio || "");
      setLocation(profileData.location || "");
      setWebsite(profileData.website || "");
      setAvatar(profileData.avatar || "");
      isFormInitializedRef.current = true;
    }
  }, [profileData]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ตรวจสอบว่าเป็นไฟล์รูปภาพ
    if (!file.type.startsWith('image/')) {
      toast.error(TOAST_MESSAGES.MEDIA.INVALID_FORMAT);
      return;
    }

    try {
      // เก็บไฟล์ไว้ (สำหรับแสดง preview)
      setAvatarFile(file);

      // แสดง preview ด้วย FileReader
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);

      // ⭐ Upload รูปทันที
      console.log('🚀 Starting image upload...');
      const result = await uploadImageMutation.mutateAsync(file);

      // ✅ เก็บ URL ที่ได้จาก backend
      console.log('✅ Image uploaded, URL:', result.url);
      setAvatar(result.url);

      toast.success(TOAST_MESSAGES.PROFILE.AVATAR_UPLOAD_SUCCESS);
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      // Error handling จะถูกจัดการโดย mutation's onError
      // Reset avatar ถ้า upload ล้มเหลว
      setAvatar(profileData?.avatar || "");
      setAvatarFile(null);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = () => {
    setAvatar("");
    setAvatarFile(null);
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ⭐ Validation
    if (!displayName.trim()) {
      toast.error(TOAST_MESSAGES.PROFILE.DISPLAYNAME_REQUIRED);
      return;
    }

    if (displayName.trim().length > 50) {
      toast.error(TOAST_MESSAGES.PROFILE.DISPLAYNAME_TOO_LONG);
      return;
    }

    if (bio.trim().length > 200) {
      toast.error(TOAST_MESSAGES.PROFILE.BIO_TOO_LONG);
      return;
    }

    if (location.trim().length > 100) {
      toast.error(TOAST_MESSAGES.PROFILE.LOCATION_TOO_LONG);
      return;
    }

    // ตรวจสอบ URL format สำหรับ website
    if (website.trim() && !isValidUrl(website.trim())) {
      toast.error(TOAST_MESSAGES.PROFILE.INVALID_WEBSITE_URL);
      return;
    }

    // ⭐ เรียก mutation เพื่อ update profile
    updateProfileMutation.mutate({
      displayName: displayName.trim(),
      bio: bio.trim() || undefined,
      location: location.trim() || undefined,
      website: website.trim() || undefined,
      avatar: avatar || undefined, // ✅ URL จาก backend (อัปโหลดแล้วใน handleAvatarChange)
    });
  };

  // Helper function สำหรับตรวจสอบ URL
  const isValidUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleCancel = () => {
    if (currentUser?.username) {
      router.push(`/profile/${currentUser.username}`);
    } else {
      router.push('/');
    }
  };

  // ⭐ รอให้ Zustand hydrate เสร็จก่อน (ป้องกัน Hydration error)
  if (!hasHydrated || isLoadingProfile) {
    return (
      <AppLayout
        breadcrumbs={[
          { label: "หน้าหลัก", href: "/" },
          { label: "แก้ไขโปรไฟล์" },
        ]}
      >
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  // ⭐ ไม่มี user data (ไม่ได้ login)
  if (!currentUser) {
    return (
      <AppLayout
        breadcrumbs={[
          { label: "หน้าหลัก", href: "/" },
          { label: "แก้ไขโปรไฟล์" },
        ]}
      >
        <div className="flex min-h-[400px] flex-col items-center justify-center">
          <h2 className="text-2xl font-bold mb-2">กรุณาเข้าสู่ระบบ</h2>
          <p className="text-muted-foreground mb-4">
            คุณต้องเข้าสู่ระบบก่อนแก้ไขโปรไฟล์
          </p>
          <Button onClick={() => router.push("/login")}>
            เข้าสู่ระบบ
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      breadcrumbs={[
        { label: "หน้าหลัก", href: "/" },
        { label: `@${currentUser.username}`, href: `/profile/${currentUser.username}` },
        { label: "แก้ไขโปรไฟล์" },
      ]}
    >
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>แก้ไขโปรไฟล์</CardTitle>
            <CardDescription>
              อัปเดตข้อมูลส่วนตัวและรูปภาพของคุณ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar */}
              <Field>
                <FieldLabel>รูปโปรไฟล์</FieldLabel>
                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden bg-muted group">
                    {avatar ? (
                      <>
                        <Image
                          src={avatar}
                          alt="Avatar"
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                        {/* Upload overlay */}
                        {uploadImageMutation.isPending && (
                          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-white mb-1" />
                            <span className="text-xs text-white">
                              {uploadImageMutation.progress}%
                            </span>
                          </div>
                        )}
                        {!uploadImageMutation.isPending && (
                          <button
                            type="button"
                            onClick={handleRemoveAvatar}
                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            disabled={uploadImageMutation.isPending}
                          >
                            <X size={20} className="text-white" />
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/10 text-3xl font-bold text-primary">
                        {displayName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                      disabled={uploadImageMutation.isPending}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={uploadImageMutation.isPending}
                    >
                      {uploadImageMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          กำลังอัปโหลด... {uploadImageMutation.progress}%
                        </>
                      ) : (
                        <>
                          <Camera className="mr-2 h-4 w-4" />
                          เปลี่ยนรูปโปรไฟล์
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      รองรับ JPG, PNG, GIF, WebP (สูงสุด 10 MB)
                    </p>
                  </div>
                </div>
              </Field>

              {/* Display Name */}
              <Field>
                <FieldLabel htmlFor="displayName">ชื่อที่แสดง *</FieldLabel>
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="ชื่อที่จะแสดงในโปรไฟล์"
                  required
                  maxLength={50}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {displayName.length}/50 ตัวอักษร
                </p>
              </Field>

              {/* Username (Read-only) */}
              <Field>
                <FieldLabel htmlFor="username">ชื่อผู้ใช้</FieldLabel>
                <Input
                  id="username"
                  type="text"
                  value={currentUser.username}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  ชื่อผู้ใช้ไม่สามารถเปลี่ยนแปลงได้
                </p>
              </Field>

              {/* Bio */}
              <Field>
                <FieldLabel htmlFor="bio">แนะนำตัว</FieldLabel>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="เขียนอะไรสักหน่อยเกี่ยวกับตัวคุณ..."
                  rows={4}
                  maxLength={200}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {bio.length}/200 ตัวอักษร
                </p>
              </Field>

              {/* Location */}
              <Field>
                <FieldLabel htmlFor="location">ที่อยู่</FieldLabel>
                <Input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="เช่น กรุงเทพมหานคร, ประเทศไทย"
                  maxLength={100}
                />
              </Field>

              {/* Website */}
              <Field>
                <FieldLabel htmlFor="website">เว็บไซต์</FieldLabel>
                <Input
                  id="website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                />
              </Field>

              {/* Error Message */}
              {updateProfileMutation.isError && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  <p className="font-semibold">เกิดข้อผิดพลาด</p>
                  <p className="mt-1">
                    {updateProfileMutation.error instanceof Error
                      ? updateProfileMutation.error.message
                      : 'ไม่สามารถอัปเดตโปรไฟล์ได้ กรุณาลองใหม่อีกครั้ง'}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={!displayName.trim() || updateProfileMutation.isPending}
                  className="flex-1"
                >
                  {updateProfileMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      กำลังบันทึก...
                    </>
                  ) : (
                    "บันทึกการเปลี่ยนแปลง"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={updateProfileMutation.isPending}
                >
                  ยกเลิก
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
