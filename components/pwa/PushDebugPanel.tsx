"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Copy,
  Bug
} from "lucide-react";

/**
 * Push Notification Debug Panel
 * แสดงสถานะและช่วย debug ปัญหา push notification
 */
export function PushDebugPanel() {
  const [status, setStatus] = useState<{
    permission: NotificationPermission;
    swRegistered: boolean;
    swActive: boolean;
    subscribed: boolean;
    subscription: PushSubscription | null;
    browserSupport: boolean;
    swUpdateAvailable: boolean;
  }>({
    permission: "default",
    swRegistered: false,
    swActive: false,
    subscribed: false,
    subscription: null,
    browserSupport: false,
    swUpdateAvailable: false,
  });

  const [isLoading, setIsLoading] = useState(true);

  const checkStatus = async () => {
    setIsLoading(true);

    try {
      // Check browser support
      const browserSupport =
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;

      if (!browserSupport) {
        setStatus({
          permission: "default",
          swRegistered: false,
          swActive: false,
          subscribed: false,
          subscription: null,
          browserSupport: false,
          swUpdateAvailable: false,
        });
        setIsLoading(false);
        return;
      }

      // Check permission
      const permission = Notification.permission;

      // Check Service Worker
      const registration = await navigator.serviceWorker.getRegistration();
      const swRegistered = !!registration;
      const swActive = !!registration?.active;

      // Check for updates
      let swUpdateAvailable = false;
      if (registration) {
        await registration.update();
        swUpdateAvailable = !!registration.waiting;
      }

      // Check subscription
      let subscription: PushSubscription | null = null;
      if (registration) {
        subscription = await registration.pushManager.getSubscription();
      }

      setStatus({
        permission,
        swRegistered,
        swActive,
        subscribed: !!subscription,
        subscription,
        browserSupport,
        swUpdateAvailable,
      });
    } catch (error) {
      console.error("Error checking status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();

    // Auto-refresh every 5 seconds
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const copySubscription = () => {
    if (status.subscription) {
      const subData = {
        endpoint: status.subscription.endpoint,
        keys: status.subscription.toJSON().keys,
      };
      navigator.clipboard.writeText(JSON.stringify(subData, null, 2));
      alert("Subscription copied to clipboard!");
    }
  };

  const updateServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration?.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
        window.location.reload();
      }
    } catch (error) {
      console.error("Error updating service worker:", error);
    }
  };

  const StatusBadge = ({ status, label }: { status: boolean; label: string }) => (
    <div className="flex items-center gap-2">
      {status ? (
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      ) : (
        <XCircle className="h-4 w-4 text-red-500" />
      )}
      <span className="text-sm">{label}</span>
      <Badge variant={status ? "default" : "destructive"}>
        {status ? "OK" : "ERROR"}
      </Badge>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            <CardTitle>Push Notification Debug</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={checkStatus}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Browser Support */}
        <StatusBadge status={status.browserSupport} label="Browser Support" />

        {status.browserSupport && (
          <>
            {/* Permission */}
            <div className="flex items-center gap-2">
              {status.permission === "granted" ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : status.permission === "denied" ? (
                <XCircle className="h-4 w-4 text-red-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              )}
              <span className="text-sm">Notification Permission</span>
              <Badge
                variant={
                  status.permission === "granted"
                    ? "default"
                    : status.permission === "denied"
                    ? "destructive"
                    : "outline"
                }
              >
                {status.permission}
              </Badge>
            </div>

            {/* Service Worker */}
            <StatusBadge status={status.swRegistered} label="Service Worker Registered" />
            <StatusBadge status={status.swActive} label="Service Worker Active" />

            {/* Update Available */}
            {status.swUpdateAvailable && (
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">Update Available</span>
                <Button size="sm" onClick={updateServiceWorker}>
                  Update Now
                </Button>
              </div>
            )}

            {/* Subscription */}
            <StatusBadge status={status.subscribed} label="Push Subscription Active" />

            {/* Subscription Details */}
            {status.subscription && (
              <div className="mt-4 p-3 bg-muted rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Subscription Details:</span>
                  <Button size="sm" variant="outline" onClick={copySubscription}>
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground break-all">
                  <p>
                    <strong>Endpoint:</strong>{" "}
                    {status.subscription.endpoint.substring(0, 60)}...
                  </p>
                  <p>
                    <strong>Expiration:</strong>{" "}
                    {status.subscription.expirationTime
                      ? new Date(status.subscription.expirationTime).toLocaleString()
                      : "Never"}
                  </p>
                </div>
              </div>
            )}

            {/* Recommendations */}
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-semibold">💡 Recommendations:</h4>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                {!status.subscribed && (
                  <li>Subscribe to push notifications first</li>
                )}
                {status.permission === "denied" && (
                  <li className="text-red-500">
                    Permission denied - Reset in browser settings
                  </li>
                )}
                {!status.swActive && (
                  <li className="text-yellow-600">
                    Service Worker not active - Try refreshing the page
                  </li>
                )}
                {status.subscribed && status.permission === "granted" && (
                  <li className="text-green-600">✅ Everything looks good!</li>
                )}
              </ul>
            </div>
          </>
        )}

        {!status.browserSupport && (
          <div className="p-4 bg-destructive/10 rounded-lg">
            <p className="text-sm text-destructive">
              {"❌ Your browser doesn't support push notifications"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
