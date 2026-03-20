// lib/useRoleSwitch.ts
// Hook for managing role switching between user and contractor modes

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from './auth-context';

import { switchRoleApi } from '../api/authapi';

export function useRoleSwitch() {
  const [switching, setSwitching] = useState(false);
  const { user, updateUser } = useAuth();
  const router = useRouter();

  // Derive hasContractorProfile from contractor existence
  const hasContractorProfile =
    user?.contractor !== null && user?.contractor !== undefined;

  const switchRole = useCallback(
    async (newRole: 'user' | 'contractor') => {
      // Prevent switching to same role
      const isCurrentlyContractor = user?.isContractor === true;
      if (isCurrentlyContractor === (newRole === 'contractor')) {
        console.log('Already in', newRole, 'mode');
        return;
      }

      // Check if user has contractor profile when switching to contractor
      if (newRole === 'contractor' && !hasContractorProfile) {
        Alert.alert(
          'No Contractor Profile',
          'You need to create a contractor profile first before switching to contractor mode.'
        );
        return;
      }

      // Check if contractor profile is confirmed
      if (newRole === 'contractor' && user?.contractor && !user.contractor.confirmed) {
        Alert.alert(
          'Profile Not Confirmed',
          'Your contractor profile is not yet confirmed. Please complete your profile verification before switching to contractor mode.'
        );
        return;
      }

      setSwitching(true);
      try {
        console.log(`🔄 Role Switch - Switching to ${newRole} mode`);

        const result = await switchRoleApi(newRole);
        console.log('🔄 Role Switch - Result:', result);

        if (result.success) {
          // Update the user in context and persist the role preference to
          // SecureStore. From this point any call to refreshSession() or
          // checkAuth() will re-apply the override, so the backend's stale
          // isContractor value can never overwrite the user's explicit choice.
          updateUser({ isContractor: newRole === 'contractor' });

          // Navigate first so the new screen is ready before the alert fires.
          if (newRole === 'contractor') {
            router.replace('/contractors');
          } else {
            router.replace('/(auth)/home');
          }

          // Show success feedback
          Alert.alert(
            'Role Switched',
            `You are now in ${newRole} mode`,
            [{ text: 'OK' }]
          );
        } else {
          // Handle specific error cases
          if (result.error?.includes('not confirmed') || result.error?.includes('confirmed')) {
            Alert.alert(
              'Profile Not Confirmed',
              'Your contractor profile is not yet confirmed. Please complete your profile verification.'
            );
          } else if (result.error?.includes('not found') || result.error?.includes('profile')) {
            Alert.alert(
              'Profile Not Found',
              'No contractor profile found. Please create one first.'
            );
          } else {
            Alert.alert(
              'Switch Failed',
              result.error || 'Unable to switch role. Please try again.'
            );
          }
        }
      } catch (error: any) {
        console.error('🔄 Role Switch - Error:', error);
        Alert.alert(
          'Error',
          error.response?.data?.error || error.message || 'Failed to switch role'
        );
      } finally {
        setSwitching(false);
      }
    },
    [user, hasContractorProfile, updateUser, router]
  );

  return {
    switchRole,
    switching,
    canSwitchToContractor: hasContractorProfile && !user?.isContractor,
    canSwitchToUser: user?.isContractor === true,
    hasContractorProfile,
  };
}
