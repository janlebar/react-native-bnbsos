// components/RoleSwitchButton.tsx
// Reusable component for switching between user and contractor roles

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { useRoleSwitch } from '../lib/useRoleSwitch';
import { useAuth } from '../lib/auth-context';

interface RoleSwitchButtonProps {
  variant?: 'full' | 'compact';
  showLabel?: boolean;
}

export function RoleSwitchButton({
  variant = 'full',
  showLabel = true,
}: RoleSwitchButtonProps) {
  const { user } = useAuth();
  const { switchRole, switching, canSwitchToContractor, canSwitchToUser, hasContractorProfile } =
    useRoleSwitch();

  // Only show if user has contractor profile
  if (!hasContractorProfile) {
    return null;
  }

  const isContractor = user?.isContractor === true;
  const handlePress = () => {
    if (isContractor) {
      switchRole('user');
    } else {
      switchRole('contractor');
    }
  };

  if (variant === 'compact') {
    return (
      <TouchableOpacity
        style={styles.compactButton}
        onPress={handlePress}
        disabled={switching}
      >
        {switching ? (
          <ActivityIndicator size="small" color="#3b82f6" />
        ) : (
          <Text style={styles.compactIcon}>↔</Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {/* Current Mode Badge */}
      <View style={[styles.badge, isContractor && styles.badgeContractor]}>
        <Text style={[styles.badgeText, isContractor && styles.badgeContractorText]}>
          {isContractor ? 'Contractor Mode' : 'User Mode'}
        </Text>
      </View>

      {/* Switch Button */}
      <TouchableOpacity
        style={[styles.button, switching && styles.buttonDisabled]}
        onPress={handlePress}
        disabled={switching}
      >
        {switching ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Text style={styles.icon}>↔</Text>
            {showLabel && (
              <Text style={styles.text}>
                {isContractor ? 'Switch to User' : 'Switch to Contractor'}
              </Text>
            )}
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeContractor: {
    backgroundColor: '#3b82f6',
  },
  badgeText: {
    color: '#1f2937',
    fontSize: 12,
    fontWeight: '600',
  },
  badgeContractorText: {
    color: '#fff',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  icon: {
    fontSize: 16,
    color: '#fff',
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  compactButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  compactIcon: {
    fontSize: 18,
    color: '#3b82f6',
  },
});
