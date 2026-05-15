import { useMemo } from 'react';

export const usePermissions = (currentUser, moduleName) => {
  return useMemo(() => {
    // 🌟 ดักจับกรณีที่ฐานข้อมูลส่ง permissions กลับมาเป็น String
    let perms = currentUser?.permissions || {};
    if (typeof perms === 'string') {
      try {
        perms = JSON.parse(perms);
      } catch (e) {
        perms = {};
      }
    }

    const userPerms = perms[moduleName] || [];

    return {
      canCreate: userPerms.includes("create"),
      canRead:   userPerms.includes("read"),
      canUpdate: userPerms.includes("update"),
      canDelete: userPerms.includes("delete"),
    };
  }, [currentUser, moduleName]);
};