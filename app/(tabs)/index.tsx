import { useState } from "react";
import { Button, Text, TextInput, View } from "react-native";
import { createUser } from "../../src/api/endpoints";

export default function HomeScreen() {
  const [name, setName] = useState("eeee");
  const [email, setEmail] = useState("m@sldafkøæadskfølx.com");
  const [password, setPassword] = useState("1234asdklfksæa56");
  const [result, setResult] = useState<string>("");

  return (
    <View style={{ padding: 16, gap: 12 }}>
      <TextInput value={name} onChangeText={setName} placeholder="Name" />
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        autoCapitalize="none"
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
      />

      <Button
        title="Create user"
        onPress={async () => {
          try {
            const res = await createUser({ name, email, password });
            setResult(`Created user: ${res.data.user.id}`);
            console.log("User created:", res.data.user);
          } catch (e: any) {
            setResult(`Error: ${e.message}`);
            console.log("Error creating user:", e);
          }
        }}
      />

      <Text>{result}</Text>
    </View>
  );
}
