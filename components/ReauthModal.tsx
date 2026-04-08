import React, { useState } from "react";
import { Modal, View, Text, TextInput, StyleSheet, TouchableOpacity } from "react-native";

interface ReauthModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
}

export const ReauthModal: React.FC<ReauthModalProps> = ({ visible, onClose, onConfirm }) => {
  const [password, setPassword] = useState("");

  const handleConfirm = () => {
    if (!password) return;
    onConfirm(password);
    setPassword("");
  };

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Re-authentication Required</Text>
          <Text style={styles.subtitle}>Enter your current password to continue</Text>

          <TextInput
            placeholder="Current Password"
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.button, styles.cancel]} onPress={onClose}>
              <Text style={styles.btnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.confirm]} onPress={handleConfirm}>
              <Text style={[styles.btnText, { color: "white" }]}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    width: "85%",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "gray",
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancel: {
    backgroundColor: "#eee",
  },
  confirm: {
    backgroundColor: "#007bff",
  },
  btnText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
