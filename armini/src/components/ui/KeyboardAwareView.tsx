import { KeyboardAvoidingView, StyleSheet, ViewProps } from 'react-native';

export function KeyboardAwareView({ style, children, ...props }: ViewProps) {
  return (
    <KeyboardAvoidingView
      style={[styles.container, style]}
      behavior="padding"
      {...props}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
