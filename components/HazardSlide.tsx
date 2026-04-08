import { useReportsStore } from "@/app/store/reportsStore";
import { Dimensions, ScrollView, View } from "react-native";
import { HazardCard } from "./HazardCard";
import React, { useEffect, useRef, useState } from "react";
// const HazardInfos = [
//     {
//         id: 1,
//         latitude: 40.7589,
//         longitude: -73.9851,
//         title: "3 Birrel Avenue",
//         description: "A landmine was identified near the sidewalk edge. Please avoid this area and follow safe detour routes.",
//         status: "Confirmed"
//     },
//     {
//         id: 2,
//         latitude: 40.7589,
//         longitude: -73.9851,
//         title: "3 Birrel Avenue",
//         description: "A landmine was identified near the sidewalk edge. Please avoid this area and follow safe detour routes.",
//         status: "Confirmed"
//     },
//     {
//         id: 3,
//         latitude: 40.7589,
//         longitude: -73.9851,
//         title: "3 Birrel Avenue",
//         description: "A landmine was identified near the sidewalk edge. Please avoid this area and follow safe detour routes.",
//         status: "Confirmed"
//     }
// ];



const { width } = Dimensions.get("window");

interface HazardSlideProps {
  onPageChange: (report: any) => void;
  reports: any;
}

export const HazardSlide: React.FC<HazardSlideProps> = ({ onPageChange, reports }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);


  useEffect(() => {
    // console.log(currentPage, reports?.length);
    if (currentPage > reports?.length - 1) {
      scrollRef.current?.scrollTo({
        x: 0, // 👈 move horizontally
        y: 0,
        animated: true,
      });
      onPageChange(0);
    }
  }, [reports])

  const handlePageChange = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(offsetX / width);
    setCurrentPage(pageIndex);

    // ✅ Get current report safely
    if (reports && reports[pageIndex]) {
      const currentReport = reports[pageIndex];
      onPageChange(currentReport);
      // you can call a callback, update state, or trigger map focus here
    }
  };

  return (
    <View style={{ backgroundColor: "transparent" }}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handlePageChange}
        style={{ paddingBottom: 20, backgroundColor: "transparent" }}
      >
        {reports &&
          reports?.length > 0 &&
          reports?.map((data) => (
            <View key={data.id} style={{ width, alignItems: "center" }}>
              <HazardCard data={data} style={{ margin: 5 }} />
            </View>
          ))}
      </ScrollView>
    </View>
  );
};
