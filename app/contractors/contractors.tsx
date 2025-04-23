// ContractorsList.tsx

import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../api/types"; // adjust path

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

import { getContractorsByLocationAndProfession } from "../../api/auth";
import { auth } from "../../lib/auth"; // adjust the path to your actual file

interface ContractorsListProps {
  location: string;
  profession: string[];
}

export default function ContractorsList({
  location,
  profession,
}: ContractorsListProps) {
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const session = await auth();
      setIsSignedIn(!!session);
    };
    checkAuth();
  }, []);

  const [contractors, setContractors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  type ContractorsListNavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    "ContractorsList"
  >;

  const navigation = useNavigation<ContractorsListNavigationProp>();

  useEffect(() => {
    if (location && profession.length > 0) {
      const fetchContractors = async () => {
        try {
          const data = await getContractorsByLocationAndProfession(
            location,
            profession
          );
          setContractors(data || []);
        } catch (error) {
          console.error("Error fetching contractors:", error);
          setContractors([]);
        } finally {
          setLoading(false);
        }
      };

      fetchContractors();
    } else {
      setLoading(false);
    }
  }, [location, profession]);

  if (!location || !profession) {
    return <Text>Please provide a valid location and profession.</Text>;
  }

  if (loading) {
    return <ActivityIndicator size="large" style={{ marginTop: 40 }} />;
  }

  if (!contractors.length) {
    return (
      <Text style={styles.noResults}>
        No contractors found for "{profession.join(", ")}" in "{location}".
      </Text>
    );
  }

  const renderContractor = ({ item: contractor }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate("ContractorDetails", { id: contractor.id })
      }
    >
      <Image
        source={{
          uri: contractor.imageId || "https://via.placeholder.com/100",
        }}
        style={styles.avatar}
      />
      <Text style={styles.name}>{contractor.name}</Text>
      <Text style={styles.specialization}>{contractor.specialization}</Text>

      <View style={styles.infoSection}>
        <Text>
          <Text style={styles.bold}>Rating:</Text> {contractor.rating ?? "N/A"}
          /10
        </Text>
        <Text>
          <Text style={styles.bold}>Experience:</Text>{" "}
          {contractor.yearsOfExperience ?? "Not specified"} years
        </Text>
        <Text>
          <Text style={styles.bold}>Availability:</Text>{" "}
          {contractor.availability}
        </Text>
        <Text>
          <Text style={styles.bold}>Certifications:</Text>{" "}
          {contractor.certifications?.join(", ") || "None"}
        </Text>
        <Text>
          <Text style={styles.bold}>Description:</Text>{" "}
          {contractor.description ?? "No description provided."}
        </Text>
        <Text>
          <Text style={styles.bold}>Contact:</Text>{" "}
          {isSignedIn ? (
            <>
              {contractor.user?.email && (
                <Text
                  style={styles.link}
                  onPress={() =>
                    Linking.openURL(`mailto:${contractor.user.email}`)
                  }
                >
                  {contractor.user.email}
                </Text>
              )}
              {contractor.phone && `, ${contractor.phone}`}
            </>
          ) : (
            "Sign in to view contact details."
          )}
        </Text>
        <Text>
          <Text style={styles.bold}>Address:</Text> {contractor.address},{" "}
          {contractor.city}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Contractors in {location}</Text>
      <FlatList
        data={contractors}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderContractor}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 20,
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  noResults: {
    padding: 16,
    fontSize: 16,
    color: "gray",
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: "center",
    marginBottom: 10,
  },
  name: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
  },
  specialization: {
    fontSize: 14,
    color: "gray",
    textAlign: "center",
    marginBottom: 8,
  },
  infoSection: {
    marginTop: 8,
  },
  bold: {
    fontWeight: "bold",
  },
  link: {
    color: "#1d4ed8",
    textDecorationLine: "underline",
  },
});
