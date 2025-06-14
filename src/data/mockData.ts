
export type Agent = {
    id: string;
    businessName: string;
    contactName: string;
    phone: string;
    location: string;
    locationFocus: string;
    documents: {
        cacCert: 'verified' | 'missing' | 'pending';
        idCard: 'verified' | 'missing' | 'pending';
        businessLicense: 'verified' | 'missing' | 'pending';
    };
    status: 'Pending' | 'Approved' | 'Rejected';
};

export const agents: Agent[] = [
    {
        id: "1",
        businessName: "Musa Properties Ltd",
        contactName: "Musa Ibrahim",
        phone: "+234 807 XXX XXXX",
        location: "Kuje, Abuja",
        locationFocus: "Residential Focus",
        documents: {
            cacCert: 'verified',
            idCard: 'verified',
            businessLicense: 'pending',
        },
        status: "Pending",
    },
    {
        id: "2",
        businessName: "Golden Homes Estate",
        contactName: "Sarah Okafor",
        phone: "+234 809 XXX XXXX",
        location: "Gwagwalada, Abuja",
        locationFocus: "Commercial & Residential",
        documents: {
            cacCert: 'verified',
            idCard: 'verified',
            businessLicense: 'verified',
        },
        status: "Approved",
    },
    {
        id: "3",
        businessName: "Prestige Realty",
        contactName: "David Adeleke",
        phone: "+234 802 XXX XXXX",
        location: "Ikeja, Lagos",
        locationFocus: "Luxury Apartments",
        documents: {
            cacCert: 'verified',
            idCard: 'verified',
            businessLicense: 'verified',
        },
        status: "Approved",
    },
    {
        id: "4",
        businessName: "NextGen Properties",
        contactName: "Fatima Bello",
        phone: "+234 805 XXX XXXX",
        location: "Wuse II, Abuja",
        locationFocus: "Commercial Spaces",
        documents: {
            cacCert: 'missing',
            idCard: 'verified',
            businessLicense: 'pending',
        },
        status: "Pending",
    },
     {
        id: "5",
        businessName: "Urban Nestings",
        contactName: "Chinedu Okoro",
        phone: "+234 803 XXX XXXX",
        location: "Lekki, Lagos",
        locationFocus: "Residential & Short-let",
        documents: {
            cacCert: 'verified',
            idCard: 'verified',
            businessLicense: 'verified',
        },
        status: "Rejected",
    },
];
