import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { parentService } from '../../services/parentService';
import { linkChildSchema, LinkChildFormData } from '../../utils/validators';

interface LinkChildFormProps {
  onSuccess?: () => void;
}

export function LinkChildForm({ onSuccess }: LinkChildFormProps) {
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<LinkChildFormData>({
    resolver: zodResolver(linkChildSchema),
    defaultValues: { student_email: '' },
  });

  const onSubmit = async (data: LinkChildFormData) => {
    try {
      await parentService.linkChild(data);
      Alert.alert('Request Sent', 'A link request has been sent to your child\'s account.');
      onSuccess?.();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Failed to send link request');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.description}>
        Enter your child's email address to send a link request. They will need to accept the request from their account.
      </Text>
      <Controller
        control={control}
        name="student_email"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Child's Email"
            value={value}
            onChangeText={onChange}
            placeholder="child@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.student_email?.message}
          />
        )}
      />
      <Button
        title="Send Link Request"
        onPress={handleSubmit(onSubmit)}
        loading={isSubmitting}
        fullWidth
        size="lg"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing[5] },
  description: { ...typography.bodyMd, color: colors.text.body, lineHeight: 24 },
});
