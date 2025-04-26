import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
} from "react-native";
import { sendMessage } from "../../../api/chatapi";

interface MessageInputProps {
  receiverName?: string | null;
  currentsenderId?: string;
  receiverId?: string;
}

const MessageInput = ({ currentsenderId, receiverId }: MessageInputProps) => {
  const [content, setContent] = useState("");

  const handleSubmit = async () => {
    if (!content.trim()) return;

    if (!currentsenderId || !receiverId) {
      console.error("senderId and receiverId must be defined");
      Alert.alert("Error", "Sender and Receiver IDs must be provided.");
      return;
    }

    try {
      const newMessage = await sendMessage(
        currentsenderId,
        receiverId,
        content
      );

      if (newMessage) {
        console.log("Message sent:", newMessage);
        setContent("");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="Type your message..."
          style={styles.input}
        />
        <TouchableOpacity onPress={handleSubmit} style={styles.button}>
          <Text style={styles.buttonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default MessageInput;

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  inputContainer: {
    flexDirection: "row",
    marginTop: 16,
  },
  input: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  button: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 16,
    justifyContent: "center",
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
