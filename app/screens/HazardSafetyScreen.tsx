import { RoundedView } from '@/components/RoundedView';
import { Header } from '@/components/ui/Header';
import React from 'react';
import {
	Image,
	ScrollView,
	StyleSheet,
	Text,
	View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function HazardSafetyScreen() {
	return (
		<View style={styles.container}>
            <SafeAreaView style={{flex: 1}} edges={['top', 'left', 'right']} >

			<Header showBack={false} title='Safety Guidance' isCommunity={false} />
			<RoundedView isOverlay={false} style={styles.roundedView}>
				<ScrollView
					contentContainerStyle={styles.contentContainer}
					showsVerticalScrollIndicator={false}
					style={styles.scrollView}
				>
					<View style={styles.titleWrap}>
						<Text style={styles.titleText}>
							How to Stay Safe around Landmines and Explosive Ordnance (EO) If You See Something Suspicious
						</Text>
					</View>

					{/* Top quick actions */}
					<View style={styles.quickActions}>
						<StepRow
							icon={require('../../assets/images/Icon1.png')}
							text="Don't touch, move, or approach it - even if it looks harmless"
						/>
						<StepRow
							icon={require('../../assets/images/Icon2.png')}
							text='Stop immediately, warn others, and carefully retrace your steps'
						/>
						<StepRow
							icon={require('../../assets/images/Icon3.png')}
							text='Use the app to report what you saw from a safe distance'
						/>
					</View>

					<InfoCard
						title='What to watch out for'
						items={[
							'Abandoned areas, destroyed buildings, or places where people avoid',
							'Unusual objects: pipes, wires, boxes, toys, metal parts',
							'Warning signs: stones in a line, sticks in an “X”, or local markings',
						]}
					/>

					<InfoCard
						title='Unsafe Behaviours to Avoid'
						items={[
							'Abandoned areas, destroyed buildings, or places where people avoid',  // Fixed
							"Don’t try to clear or “make safe” explosive items",
						]}
					/>

					<InfoCard
						title='Keep Children Safe'
						items={[
							'Stay on known paths - no shortcuts or dares',
							'Tell an adult if you see something dangerous',
							"Never touch objects you didn’t drop yourself",
						]}
					/>
				</ScrollView>
			</RoundedView>
			</SafeAreaView>
		</View>
	);
}

type StepRowProps = {
	icon: any;
	text: string;
};

const StepRow: React.FC<StepRowProps> = ({ icon, text }) => {
	return (
		<View style={styles.stepRow}>
			<View style={styles.stepIconWrap}>
				<Image source={icon} style={styles.stepIcon} resizeMode='contain' />
			</View>
			<Text style={styles.stepText}>{text}</Text>
		</View>
	);
};

type InfoCardProps = {
	title: string;
	items: string[];
};

const InfoCard: React.FC<InfoCardProps> = ({ title, items }) => {
	return (
		<View style={styles.infoCard}>
			<Text style={styles.infoTitle}>{title}</Text>
			{items.map((item, index) => (
				<View key={`${title}-${index}`} style={styles.bulletRow}>
					<View style={styles.bulletDot} />
					<Text style={styles.bulletText}>{item}</Text>
				</View>
			))}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: 'black',
	},
	roundedView: {
		flex: 2,
		gap: 10,
		marginTop: 20,
	},
	header: {
		paddingHorizontal: 16,
		paddingVertical: 12,
		marginTop: 32,
	},
	scrollView: {
		width: '100%',
	},
	contentContainer: {
		alignItems: 'center',
		gap: 16,
		paddingBottom: 24,
	},
	titleWrap: {
		paddingHorizontal: 16,
	},
	titleText: {
		fontWeight: 600,
		fontSize: 16,
		textAlign: 'left',
	},
	quickActions: {
		width: '100%',
		gap: 8,
		paddingHorizontal: 12,
	},
	stepRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		backgroundColor: 'white',
		borderRadius: 10,
		padding: 12,
		marginHorizontal: 4,
	},
	stepIconWrap: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: '#E7FBF6',
		alignItems: 'center',
		justifyContent: 'center',
	},
	stepIcon: {
		width: 20,
		height: 20,
	},
	stepText: {
		flex: 1,
		fontSize: 13,
		color: '#2A2A2A',
	},
	infoCard: {
		width: '92%',
		backgroundColor: 'white',
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#DBDBDB',
		padding: 14,
		gap: 8,
	},
	infoTitle: {
		fontWeight: 700,
		fontSize: 15,
		marginBottom: 2,
	},
	bulletRow: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: 8,
		marginTop: 4,
	},
	bulletDot: {
		width: 6,
		height: 6,
		borderRadius: 3,
		backgroundColor: '#2A2A2A',
		marginTop: 7,
	},
	bulletText: {
		flex: 1,
		fontSize: 13,
		color: '#444',
		lineHeight: 18,
	},
});