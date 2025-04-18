import React, { useState, useTransition } from "react";
import { View, Text, StyleSheet, Switch } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { TextInput, Button } from "react-native-paper";
import { loginApi } from "../api/auth";
import { saveToken } from "../utils/secureStore";
import { useRouter } from "expo-router";

type LoginFormValues = {
  email: string;
  password: string;
  code: string;
};

export default function LoginForm() {
  const router = useRouter();
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [isContractor, setIsContractor] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  const { control, handleSubmit, reset, setValue } = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
      code: "",
    },
  });

  const onSubmit = (values: LoginFormValues) => {
    setError("");
    setSuccess("");

    const email = values.email.trim().toLowerCase();
    const password = values.password.trim();

    startTransition(() => {
      loginApi({
        email,
        password,
        isContractor,
      })
        .then(async (response) => {
          if (response.twoFactorRequired) {
            setShowTwoFactor(true);
            return;
          }
          await saveToken(response.token);
          setSuccess("Login successful!");
          reset();
          router.replace("/(auth)/home");
        })
        .catch(() => setError("Invalid credentials or something went wrong"));
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Welcome Back</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}

      {!showTwoFactor && (
        <>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Email"
                value={value}
                onChangeText={onChange}
                disabled={isPending}
                autoCapitalize="none"
                style={styles.input}
                mode="flat"
                underlineColor="gray"
                activeUnderlineColor="black"
                textColor="black"
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Password"
                value={value}
                onChangeText={onChange}
                disabled={isPending}
                secureTextEntry
                style={styles.input}
                mode="flat"
                underlineColor="gray"
                activeUnderlineColor="black"
                textColor="black"
              />
            )}
          />

          <View style={styles.switchRow}>
            <Text style={styles.label}>Log in as Contractor</Text>
            <Switch
              value={isContractor}
              onValueChange={setIsContractor}
              disabled={isPending}
              thumbColor={isContractor ? "black" : "gray"}
              trackColor={{ false: "#ccc", true: "#444" }}
            />
          </View>
        </>
      )}

      {showTwoFactor && (
        <Controller
          control={control}
          name="code"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Two-Factor Code"
              value={value}
              onChangeText={onChange}
              disabled={isPending}
              style={styles.input}
              placeholder="12345"
              mode="flat"
              underlineColor="gray"
              activeUnderlineColor="black"
              textColor="black"
            />
          )}
        />
      )}

      <Button
        mode="contained"
        onPress={handleSubmit(onSubmit)}
        loading={isPending}
        disabled={isPending}
        style={styles.button}
        labelStyle={styles.buttonLabel}
        contentStyle={{ backgroundColor: "black" }}
      >
        {showTwoFactor ? "Confirm" : "Login"}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 32,
    color: "black",
    textAlign: "center",
  },
  input: { marginBottom: 16, backgroundColor: "transparent" },
  button: { marginTop: 24, borderRadius: 8 },
  buttonLabel: { color: "white", fontSize: 16, fontWeight: "bold" },
  error: { color: "red", marginBottom: 16, textAlign: "center" },
  success: { color: "green", marginBottom: 16, textAlign: "center" },
  label: { color: "black", fontSize: 16 },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
    justifyContent: "space-between",
  },
});
// import React, { useState, useTransition } from "react";
// import { View, Text, StyleSheet, Switch } from "react-native";
// import { useForm, Controller } from "react-hook-form";
// import { TextInput, Button } from "react-native-paper";
// import { loginApi } from "../api/auth";
// import { saveToken } from "../utils/secureStore";
// import { useRouter } from "expo-router";

// type LoginFormValues = {
//   email: string;
//   password: string;
//   code: string;
// };

// export default function LoginForm() {
//   const router = useRouter();
//   const [showTwoFactor, setShowTwoFactor] = useState(false);
//   const [isContractor, setIsContractor] = useState(false);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");
//   const [isPending, startTransition] = useTransition();

//   const { control, handleSubmit, reset, setValue } = useForm<LoginFormValues>({
//     defaultValues: {
//       email: "",
//       password: "",
//       code: "",
//     },
//   });

//   const onSubmit = (values: LoginFormValues) => {
//     setError("");
//     setSuccess("");

//     // sanitize inputs
//     const email = values.email.trim().toLowerCase();
//     const password = values.password.trim();

//     startTransition(() => {
//       loginApi({
//         email,
//         password,
//         isContractor,
//       })
//         .then(async (response) => {
//           if (response.twoFactorRequired) {
//             setShowTwoFactor(true);
//             return;
//           }
//           await saveToken(response.token);
//           setSuccess("Login successful!");
//           reset();
//           router.replace("/(auth)/home");
//         })
//         .catch(() => setError("Invalid credentials or something went wrong"));
//     });
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.header}>Welcome Back</Text>

//       {error ? <Text style={styles.error}>{error}</Text> : null}
//       {success ? <Text style={styles.success}>{success}</Text> : null}

//       {!showTwoFactor && (
//         <>
//           <Controller
//             control={control}
//             name="email"
//             render={({ field: { onChange, value } }) => (
//               <TextInput
//                 label="Email"
//                 value={value}
//                 onChangeText={onChange}
//                 disabled={isPending}
//                 autoCapitalize="none"
//                 style={styles.input}
//               />
//             )}
//           />

//           <Controller
//             control={control}
//             name="password"
//             render={({ field: { onChange, value } }) => (
//               <TextInput
//                 label="Password"
//                 value={value}
//                 onChangeText={onChange}
//                 disabled={isPending}
//                 secureTextEntry
//                 style={styles.input}
//               />
//             )}
//           />

//           <View style={styles.switchRow}>
//             <Text>Log in as Contractor</Text>
//             <Switch
//               value={isContractor}
//               onValueChange={setIsContractor}
//               disabled={isPending}
//             />
//           </View>
//         </>
//       )}

//       {showTwoFactor && (
//         <Controller
//           control={control}
//           name="code"
//           render={({ field: { onChange, value } }) => (
//             <TextInput
//               label="Two-Factor Code"
//               value={value}
//               onChangeText={onChange}
//               disabled={isPending}
//               style={styles.input}
//               placeholder="12345"
//             />
//           )}
//         />
//       )}

//       <Button
//         mode="contained"
//         onPress={handleSubmit(onSubmit)}
//         loading={isPending}
//         disabled={isPending}
//         style={styles.button}
//       >
//         {showTwoFactor ? "Confirm" : "Login"}
//       </Button>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { padding: 20, flex: 1, justifyContent: "center" },
//   header: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
//   input: { marginBottom: 12 },
//   button: { marginTop: 16 },
//   error: { color: "red", marginBottom: 10 },
//   success: { color: "green", marginBottom: 10 },
//   switchRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginVertical: 12,
//     justifyContent: "space-between",
//   },
// });

// import React, { useState } from "react";
// import { View, TextInput, Button, Text, StyleSheet } from "react-native";
// import { loginApi } from "../api/auth";
// import { saveToken } from "../utils/secureStore";
// import { useRouter } from "expo-router";

// export default function LoginForm() {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const router = useRouter();

//   const handleLogin = async () => {
//     try {
//       const token = await loginApi({ email, password });
//       await saveToken(token);
//       router.replace("/(auth)/home");
//     } catch (e) {
//       setError("Invalid credentials");
//     }
//   };

//   return (
//     <View style={styles.container}>
//       {error ? <Text style={styles.error}>{error}</Text> : null}
//       <TextInput
//         style={styles.input}
//         placeholder="Email"
//         onChangeText={setEmail}
//         value={email}
//       />
//       <TextInput
//         style={styles.input}
//         placeholder="Password"
//         secureTextEntry
//         onChangeText={setPassword}
//         value={password}
//       />
//       <Button title="Login" onPress={handleLogin} />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { padding: 20 },
//   input: { height: 40, borderBottomWidth: 1, marginBottom: 12 },
//   error: { color: "red", marginBottom: 10 },
// });
