import TitleSVG from '@/assets/images/Title.svg';
import { Button } from '@/components/Button';
import { ImageView } from '@/components/ImageView';
import { RoundedView } from '@/components/RoundedView';
import { Header } from '@/components/ui/Header';
import { Logo } from '@/components/ui/Logo';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { userData } from '../store/userStore';

const CM_SL_1 = require('../../assets/images/SliderBackground_1_Community.png');

const CommunityBackgroundArray = [
    require('../../assets/images/SliderBackground_1_Community.png'),
    require('../../assets/images/SliderBackground_2_Community.png'),
    require('../../assets/images/SliderBackground_3_Community.png'),
    require('../../assets/images/SliderBackground_1_Operational.png'),
    require('../../assets/images/SliderBackground_2_Operational.png'),
    require('../../assets/images/SliderBackground_3_Operational.png'),
]

const { width } = Dimensions.get('window');

const slides = [
    { id: '1', title: 'Your landmine and explosive ordinance safety companion.', description: 'Instantly see marked, suspect or confirmed hazardous villages, or areas, on a detailed map, powered by community reports and expert data.' },
    { id: '2', title: 'Know when you’re near risk.', description: 'Get notified the moment you approach boundaries of landmine and explosive ordinance areas, so you can reroute and stay safe.' },
    { id: '3', title: 'Safety, without signal.', description: 'Download any region’s landmine and explosive ordinance affected area map for offline use. Plan and navigate safe movements.' },
];

export default function SliderScreen() {
    const router = useRouter();
    const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const userRole = userData.getState().userRole;

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    const onPressContinue = () => {
        if(currentIndex >= 2)
        {
            router.push('/screens/SelectLanguageScreen');
            return;
        }
        flatListRef.current?.scrollToIndex({ index: (currentIndex + 1), animated: true });
    }

    return (
        <View style={{ flex: 1 }}>
            <ImageView backgroundImage={CommunityBackgroundArray[userRole === 'community' ? currentIndex : currentIndex + 3]} />
            <SafeAreaView style={{flex : 1}} edges={['top', 'left', 'right']}>
            <Header isCommunity={false} title='' />
            <View style={{ flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                <View style={styles.logoContainer}>
                    <Logo size={45} style={styles.logo} />
                    <TitleSVG width={80} style={styles.title} />
                </View>
                <RoundedView style={styles.roundedView} radius={16}>
                        <FlatList
                            ref={flatListRef}
                            data={slides}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <View style={{ width: width - 40, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                                    <Text style={{ textAlign: 'center', color: 'black', fontSize: 20, fontWeight: '600', zIndex: 3, width: '100%' }}>
                                        {item.title}
                                    </Text>
                                    <Text
                                        style={{
                                            color: 'black',
                                            fontSize: 16,
                                            fontWeight: '400',
                                            marginTop: 5,
                                            width: '100%',
                                            paddingHorizontal: 20,
                                            textAlign: 'center',
                                        }}
                                    >
                                        {item.description}
                                    </Text>
                                </View>
                            )}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onViewableItemsChanged={onViewableItemsChanged}
                            viewabilityConfig={viewConfig}
                        />

                        <View style={styles.dotsContainer}>
                            {slides.map((_, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.dot,
                                        {
                                            width: index === currentIndex ? 20 : 8,
                                            backgroundColor:
                                                index === currentIndex ? '#20C997' : 'rgba(32, 201, 151, 0.3)',
                                        },
                                    ]}
                                />
                            ))}
                        </View>

                        {/* Continue Button */}
                        <View style={{ width: '100%' }}>
                            <Button label="Continue" onPress={onPressContinue} />
                        </View>
                </RoundedView>
            </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    logoContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        marginTop: 10,
        marginBottom: 20
    },
    logo: {

    },
    title: {

    },
    roundedView: {
        bottom: 0,
        zIndex: 2,
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 30,
    },
    dot: {
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    slide: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: { fontSize: 24, color: '#333' },
});



// const styles = StyleSheet.create({
//     container: { flex: 1, backgroundColor: '#fff' },
//     slide: {
//       justifyContent: 'center',
//       alignItems: 'center',
//     },
//     text: { fontSize: 24, color: '#333' },


//   });
