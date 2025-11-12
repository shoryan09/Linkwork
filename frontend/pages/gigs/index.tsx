import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import api from "@/lib/api";

export default function GigsPage() {
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGigs();
  }, []);

  const fetchGigs = async () => {
    try {
      const response = await api.get("/gigs");
      setGigs(response.data.gigs);
    } catch (error) {
      console.error("Error fetching gigs:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Browse Gigs</h1>

        {loading ? (
          <p className="text-center text-gray-600">Loading gigs...</p>
        ) : gigs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gigs.map((gig: any) => (
              <div key={gig._id} className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-2">{gig.title}</h3>
                <p className="text-gray-600 mb-4">{gig.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-blue-600 font-semibold">
                    ₹{gig.pricing?.basic?.price || "N/A"}
                  </span>
                  <span className="text-gray-500 text-sm">{gig.category}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No gigs available.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
