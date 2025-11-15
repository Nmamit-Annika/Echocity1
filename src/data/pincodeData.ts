// Local pincode data for major Indian cities
export interface PincodeData {
  officeName: string;
  contact: string;
  location: [number, number];
  city: string;
}

export const PINCODE_DATA: Record<string, PincodeData> = {
  "110001": {
    officeName: "Connaught Place Municipal Office",
    contact: "011-23456789",
    location: [28.6330, 77.2193],
    city: "New Delhi"
  },
  "400001": {
    officeName: "Mumbai Municipal Corporation - Fort",
    contact: "022-22694725",
    location: [18.9300, 72.8200],
    city: "Mumbai"
  },
  "400051": {
    officeName: "Bandra West Ward Office",
    contact: "022-26451234",
    location: [19.0544, 72.8402],
    city: "Mumbai"
  },
  "560001": {
    officeName: "Majestic Area Civic Center",
    contact: "080-22987654",
    location: [12.9767, 77.5713],
    city: "Bangalore"
  },
  "600001": {
    officeName: "Parry's Corner Corporation Office",
    contact: "044-25384567",
    location: [13.0885, 80.2828],
    city: "Chennai"
  },
  "500001": {
    officeName: "Hyderabad Greater Municipal Corporation",
    contact: "040-23456789",
    location: [17.3850, 78.4867],
    city: "Hyderabad"
  },
  "700001": {
    officeName: "Kolkata Municipal Corporation - BBD Bagh",
    contact: "033-22143526",
    location: [22.5726, 88.3639],
    city: "Kolkata"
  },
  "380001": {
    officeName: "Ahmedabad Municipal Corporation",
    contact: "079-25506644",
    location: [23.0225, 72.5714],
    city: "Ahmedabad"
  },
  "411001": {
    officeName: "Pune Municipal Corporation - PMC",
    contact: "020-26128394",
    location: [18.5204, 73.8567],
    city: "Pune"
  },
  "302001": {
    officeName: "Jaipur Municipal Corporation",
    contact: "0141-2743943",
    location: [26.9124, 75.7873],
    city: "Jaipur"
  }
};