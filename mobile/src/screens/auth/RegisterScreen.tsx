import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ChevronRight } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { registerSchema, RegisterFormData } from '../../utils/validators';
import { useAuth } from '../../hooks/useAuth';
import { AccountType } from '../../types/common';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { PhoneInput } from '../../components/common/PhoneInput';
import { AccountTypeSelector } from '../../components/auth/AccountTypeSelector';
import { AuthScreenProps } from '../../navigation/types';

const STEPS = ['type', 'identity', 'credentials', 'contact'] as const;

export function RegisterScreen({ navigation }: AuthScreenProps<'Register'>) {
  const { register, isLoading, error, setError } = useAuth();
  const [step, setStep] = useState(0);
  const [selectedType, setSelectedType] = useState<AccountType | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    trigger,
    getValues,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirm_password: '',
      account_type: 'student',
      first_name: '',
      last_name: '',
      date_of_birth: '',
      government_id: '',
      id_country_code: 'LK',
      phone_country_code: '+94',
      phone_number: '',
      gender: '',
    },
  });

  const handleNext = async () => {
    let fieldsToValidate: (keyof RegisterFormData)[] = [];
    switch (STEPS[step]) {
      case 'identity':
        fieldsToValidate = ['first_name', 'last_name', 'date_of_birth', 'government_id', 'id_country_code'];
        break;
      case 'credentials':
        fieldsToValidate = ['email', 'password', 'confirm_password'];
        break;
    }
    const valid = fieldsToValidate.length === 0 || (await trigger(fieldsToValidate));
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const onSubmit = async (data: RegisterFormData) => {
    if (!selectedType) return;
    setError(null);
    try {
      const { confirm_password, ...rest } = data;
      const result = await register({ ...rest, account_type: selectedType });
      if (!result.autoLoggedIn) {
        navigation.navigate('Login');
      }
    } catch {
      // error set by hook
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => (step > 0 ? setStep((s) => s - 1) : navigation.goBack())}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={colors.text.heading} strokeWidth={1.5} />
          </TouchableOpacity>
          <View style={styles.progress}>
            {STEPS.map((_, i) => (
              <View key={i} style={[styles.dot, i <= step && styles.dotActive]} />
            ))}
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <MotiView
            key={step}
            from={{ opacity: 0, translateX: 30 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: 'timing', duration: 300 }}
          >
            {STEPS[step] === 'type' && (
              <AccountTypeSelector
                selected={selectedType}
                onSelect={(type) => {
                  setSelectedType(type);
                  setStep(1);
                }}
              />
            )}

            {STEPS[step] === 'identity' && (
              <View>
                <Text style={styles.stepTitle}>Personal Details</Text>
                <Controller
                  control={control}
                  name="first_name"
                  render={({ field: { onChange, value } }) => (
                    <Input label="First Name" value={value} onChangeText={onChange} error={errors.first_name?.message} autoComplete="given-name" />
                  )}
                />
                <Controller
                  control={control}
                  name="last_name"
                  render={({ field: { onChange, value } }) => (
                    <Input label="Last Name" value={value} onChangeText={onChange} error={errors.last_name?.message} autoComplete="family-name" />
                  )}
                />
                <Controller
                  control={control}
                  name="date_of_birth"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label="Date of Birth"
                      placeholder="YYYY-MM-DD"
                      value={value}
                      keyboardType="numeric"
                      maxLength={10}
                      onChangeText={(text) => {
                        const digits = text.replace(/\D/g, '');
                        let formatted = digits;
                        if (digits.length > 4) formatted = digits.slice(0, 4) + '-' + digits.slice(4);
                        if (digits.length > 6) formatted = digits.slice(0, 4) + '-' + digits.slice(4, 6) + '-' + digits.slice(6, 8);
                        onChange(formatted);
                      }}
                      error={errors.date_of_birth?.message}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="government_id"
                  render={({ field: { onChange, value } }) => (
                    <Input label="Government ID" placeholder="NIC or Passport" value={value} onChangeText={onChange} error={errors.government_id?.message} />
                  )}
                />
                <Controller
                  control={control}
                  name="id_country_code"
                  render={({ field: { onChange, value } }) => (
                    <Input label="ID Country Code" placeholder="LK" value={value} onChangeText={onChange} maxLength={3} error={errors.id_country_code?.message} />
                  )}
                />
                <Button title="Next" onPress={handleNext} fullWidth size="lg" icon={<ChevronRight size={20} color={colors.white} strokeWidth={1.5} />} />
              </View>
            )}

            {STEPS[step] === 'credentials' && (
              <View>
                <Text style={styles.stepTitle}>Account Credentials</Text>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, value } }) => (
                    <Input label="Email" value={value} onChangeText={onChange} error={errors.email?.message} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
                  )}
                />
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, value } }) => (
                    <Input label="Password" value={value} onChangeText={onChange} error={errors.password?.message} isPassword hint="At least 8 characters, with uppercase, lowercase, and a number" />
                  )}
                />
                <Controller
                  control={control}
                  name="confirm_password"
                  render={({ field: { onChange, value } }) => (
                    <Input label="Confirm Password" value={value} onChangeText={onChange} error={errors.confirm_password?.message} isPassword />
                  )}
                />
                <Button title="Next" onPress={handleNext} fullWidth size="lg" icon={<ChevronRight size={20} color={colors.white} strokeWidth={1.5} />} />
              </View>
            )}

            {STEPS[step] === 'contact' && (
              <View>
                <Text style={styles.stepTitle}>Contact (Optional)</Text>
                <Controller
                  control={control}
                  name="phone_country_code"
                  render={({ field: { onChange, value } }) => (
                    <Controller
                      control={control}
                      name="phone_number"
                      render={({ field: { onChange: onChangePhone, value: phoneValue } }) => (
                        <PhoneInput
                          label="Phone Number"
                          countryCode={value || ''}
                          phoneNumber={phoneValue || ''}
                          onChangeCountryCode={onChange}
                          onChangePhoneNumber={onChangePhone}
                        />
                      )}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="gender"
                  render={({ field: { onChange, value } }) => (
                    <Input label="Gender" placeholder="Optional" value={value || ''} onChangeText={onChange} />
                  )}
                />
                {error && <Text style={styles.error}>{error}</Text>}
                <Button title="Create Account" onPress={handleSubmit(onSubmit)} loading={isLoading} fullWidth size="lg" />
              </View>
            )}
          </MotiView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface.base },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    gap: spacing[4],
  },
  backButton: { padding: spacing[2] },
  progress: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surface.high,
  },
  dotActive: {
    backgroundColor: colors.primary.blue,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[8],
  },
  stepTitle: {
    ...typography.h2,
    color: colors.text.heading,
    marginBottom: spacing[6],
    marginTop: spacing[4],
  },
  error: {
    ...typography.bodySm,
    color: colors.semantic.error,
    textAlign: 'center',
    marginBottom: spacing[4],
  },
});
