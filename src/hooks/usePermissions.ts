import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PermissionResult {
  permission_name: string;
  permission_category: string;
}

export const usePermissions = (userId: string | undefined) => {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchPermissions = async () => {
      try {
        // Get user permissions using the database function
        const { data, error } = await supabase
          .rpc('get_user_permissions', { _user_id: userId });

        if (error) {
          console.error("Error fetching permissions:", error);
          setPermissions([]);
        } else {
          const results = data as PermissionResult[] | null;
          const permissionNames = results?.map(p => p.permission_name) || [];
          setPermissions(permissionNames);
          setIsSuperAdmin(permissionNames.includes('super_admin'));
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [userId]);

  const hasPermission = (permission: string): boolean => {
    if (isSuperAdmin) return true;
    return permissions.includes(permission);
  };

  const hasAnyPermission = (perms: string[]): boolean => {
    if (isSuperAdmin) return true;
    return perms.some(p => permissions.includes(p));
  };

  const hasAllPermissions = (perms: string[]): boolean => {
    if (isSuperAdmin) return true;
    return perms.every(p => permissions.includes(p));
  };

  return {
    permissions,
    loading,
    isSuperAdmin,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions
  };
};

// Log admin action to audit trail
export const logAdminAction = async (
  adminId: string,
  action: string,
  details: Record<string, any> = {}
) => {
  try {
    await supabase.from("admin_logs").insert({
      admin_id: adminId,
      action,
      details,
      ip_address: null, // Would need edge function to get real IP
      user_agent: navigator.userAgent
    });
  } catch (error) {
    console.error("Error logging admin action:", error);
  }
};
