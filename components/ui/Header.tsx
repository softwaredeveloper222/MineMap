import Back from '@/assets/images/Back.svg';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

type HeaderProps = {
  showBack?: boolean;
  height?: number;
  color?: string;
  title?: string;
  avataUrl?: string | number;
  status?: string;
  isCommunity?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Header({
  showBack = true,
  height = 60,
  color = '#ffffff',
  title = 'Community User',
  avataUrl = require('@/assets/images/Avata.jpg'),
  status = 'Active Now',
  isCommunity = true,
  style,
}: HeaderProps) {
  const router = useRouter();

  const renderAvatar = () => {
    if (avataUrl) {
      return (
        <Image
          source={typeof avataUrl === 'string' ? { uri: avataUrl } : avataUrl}
          style={styles.avatar}
          contentFit="cover"
        />
      );
    }
    return <Text style={styles.avatarInitial}>{title[0]}</Text>;
  };

  return (
    <View style={[styles.header, { height }, style]}>
      {showBack && <TouchableOpacity style={styles.back} activeOpacity={0.6} onPress={() => router.back()}>
        <Back width={47} height={27} />
      </TouchableOpacity>}

      {isCommunity ? (
        <View style={styles.communityContainer}>
          <View style={styles.userInfoRow}>
            <View style={styles.avatarContainer}>{renderAvatar()}</View>
            <View style={styles.userTextContainer}>
              <Text style={styles.userName}>{title}</Text>
              <View style={styles.statusRow}>
                <Text style={styles.statusText}>{status}</Text>
                <View style={styles.statusDot} />
              </View>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>{title}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  back: {
    position: 'absolute',
    left: 30,
    justifyContent: 'center',
    height: '100%',
  },
  // For community = false
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 24,
    color: 'white',
  },
  // For community = true
  communityContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  userInfoRow: {
    flexDirection: 'row',
    marginLeft: 100,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 30,
    backgroundColor: '#ccc',
    marginRight: 8,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  userTextContainer: {
    justifyContent: 'center',
  },
  userName: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.7,
  },
  statusDot: {
    width: 10,
    height: 10,
    marginLeft: 6,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
});
