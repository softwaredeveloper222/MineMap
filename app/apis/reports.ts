import { firestore } from "@/firebase/firebase";

import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query } from 'firebase/firestore';
import { uploadImage } from "@/hooks/functions";

export const saveReport = async (report: any, userRole: string, userId: string) => {
    try {
      const images = report.images || [];
      
      // ✅ Upload all images and wait for completion with validation
      let uploadedImages: string[] = [];
      if(images.length > 0) {
        await Promise.all(
          images.map(async (image: string) => {
            const uploadedImage = await uploadImage(image);
            if(uploadedImage) {
              uploadedImages.push(uploadedImage);
            }
          })
        );
      }

      const detail = {
        ...report,
        images: uploadedImages,
        userRole,
        userId,
        createdAt: new Date().getTime(),
      };

  
      const reportDetailRef = await addDoc(collection(firestore, "report_details"), detail);
      if(!reportDetailRef) {
        throw new Error("Failed to save report detail");
      }
  
      const reportData = {
        detail_id: reportDetailRef?.id,
        userId,
        userRole,
        coverImage: uploadedImages && uploadedImages?.length > 0 ? uploadedImages?.[0] : '',
        type: report?.type,
        locations: report?.locations,
        pickMode: report?.pickMode,
        description: report?.description,
        status: report?.classification,
        createdAt: new Date().getTime(),
      };
  
      const reportRef = await addDoc(collection(firestore, "reports"), reportData);
      if(!reportRef) {
        throw new Error("Failed to save report");
      }
      return { ...reportData, id: reportRef?.id };
    } catch (error) {
      console.log("Error saving report:", error);
      return error; // rethrow for caller to handle
    }
  };
  


export const getReports = async (userId: string) => {
    try {
        const reportsRef = collection(firestore, "reports");
        const q = query(reportsRef/*, where("userId", "!=", userId)*/);
        const querySnapshot = await getDocs(q);

        const reports = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        return reports;
    } catch (error) {
        console.log("Error fetching reports:", error);
        return [];
    }
};

export const getReportDetailById = async (reportId: string) => {
    try {
        const detailRef = doc(firestore, "report_details", reportId);
        const detailSnap = await getDoc(detailRef);

        if (detailSnap.exists()) {
            return {
                id: detailSnap.id,
                ...detailSnap.data(),
            };
        } else {
            console.log("No such report detail!");
            return null;
        }
    } catch (error) {
        console.log("Error fetching report detail:", error);
        return null;
    }
};

export const deleteReport = async (reportId: string) => {
    try {
        // First get the report document
        const reportRef = doc(firestore, "reports", reportId);
        const reportSnap = await getDoc(reportRef);

        if (!reportSnap.exists()) {
            console.log("Report not found");
            return false;
        }

        const reportData = reportSnap.data();
        const detailId = reportData?.detail_id;

        // Delete the report document
        await deleteDoc(reportRef);

        // Delete the linked report detail (if exists)
        if (detailId) {
            const detailRef = doc(firestore, "report_details", detailId);
            await deleteDoc(detailRef);
        }

        return true;
    } catch (error) {
        console.log("Error deleting report:", error);
        return false;
    }
};  