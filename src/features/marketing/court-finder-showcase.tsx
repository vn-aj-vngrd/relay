import Link from "next/link";

import { CourtFinder } from "@/features/venues/court-finder";
import type { CebuVenue } from "@/features/venues/queries";

const sampleCourts: CebuVenue[] = [
  {
    id: "all-day-dink-pickleball-court",
    slug: "all-day-dink-pickleball-court",
    name: "All Day Dink",
    address: "Casili, Consolacion, Cebu",
    latitude: 10.370257,
    longitude: 123.949452,
    environment: "outdoor",
    courtCount: 2,
    hours: null,
    priceRange: "From ₱300 per hour",
    parking: "Available",
    amenities: [],
    paddleRental: false,
    contact: null,
    websiteUrl: null,
    socialUrl: null,
    bookingUrl: null,
    listingStatus: "unverified",
    sourceUrl: null,
  },
  {
    id: "andot-pickle-court",
    slug: "andot-pickle-court",
    name: "ANDOT PICKLE COURT",
    address: "Jade St., Guadalupe, Cebu City",
    latitude: 10.324376,
    longitude: 123.878696,
    environment: "indoor",
    courtCount: 2,
    hours: null,
    priceRange: "₱500 per hour",
    parking: "Available",
    amenities: [],
    paddleRental: true,
    contact: null,
    websiteUrl: null,
    socialUrl: null,
    bookingUrl: null,
    listingStatus: "unverified",
    sourceUrl: null,
  },
  {
    id: "citiloft-pickleball-cebu",
    slug: "citiloft-pickleball-cebu",
    name: "CitiLoft Pickleball – Cebu",
    address: "General Maxilom Ave, Cebu City",
    latitude: 10.310258,
    longitude: 123.904528,
    environment: "indoor",
    courtCount: 2,
    hours: null,
    priceRange: "From ₱175 per hour",
    parking: "Available",
    amenities: [],
    paddleRental: false,
    contact: null,
    websiteUrl: null,
    socialUrl: null,
    bookingUrl: null,
    listingStatus: "unverified",
    sourceUrl: null,
  },
  {
    id: "court-district-cebu",
    slug: "court-district-cebu",
    name: "Court District Cebu",
    address: "Tingub, Mandaue City, Cebu",
    latitude: 10.360209,
    longitude: 123.936225,
    environment: "indoor",
    courtCount: 2,
    hours: null,
    priceRange: "From ₱450 per hour",
    parking: "Available",
    amenities: [],
    paddleRental: true,
    contact: null,
    websiteUrl: null,
    socialUrl: null,
    bookingUrl: null,
    listingStatus: "unverified",
    sourceUrl: null,
  },
  {
    id: "csports-pickleball",
    slug: "csports-pickleball",
    name: "CSports Pickleball",
    address: "Tayud, Consolacion, Cebu",
    latitude: 10.366299,
    longitude: 123.965523,
    environment: "indoor",
    courtCount: 7,
    hours: null,
    priceRange: "₱350 per court per hour",
    parking: "Available",
    amenities: [],
    paddleRental: true,
    contact: null,
    websiteUrl: null,
    socialUrl: null,
    bookingUrl: null,
    listingStatus: "unverified",
    sourceUrl: null,
  },
];

export function CourtFinderShowcase() {
  return (
    <section id="court-finder" className="border-b border-[#deded9] bg-white px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-[1180px]">
        <div data-marketing-reveal="split" className="grid items-end gap-8 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold text-[#526415]">Cebu Court Finder</p>
            <h2 className="mt-4 max-w-xl text-3xl font-[620] tracking-[-0.038em] sm:text-5xl">Find a court in Cebu.</h2>
          </div>
          <div className="lg:justify-self-end">
            <p className="max-w-xl text-base leading-7 text-[#66666c]">
              Search by court or neighborhood. Check the setting, price, distance, directions, and booking link. Pick a
              court to start a game.
            </p>
            <Link
              href="/courts"
              className="pressable mt-5 inline-flex min-h-10 items-center justify-center rounded-lg border border-transparent bg-primary px-4 text-[13px] font-semibold text-white shadow-[inset_0_1px_0_oklch(1_0_0/.22)] hover:bg-primary-hover"
            >
              Find a court
            </Link>
          </div>
        </div>

        <div className="mt-12 rounded-xl border border-[#d9d9d4] bg-surface p-4 text-ink shadow-[0_8px_8px_rgb(20_24_34_/_0.08)] sm:p-6">
          <CourtFinder
            venues={sampleCourts}
            isAuthenticated={false}
            detailBasePath="/courts"
            showFilterTopBorder={false}
            className="mt-0"
          />
        </div>
        <p className="mt-3 text-xs leading-5 text-[#6b6b70]">
          Five sample Cebu courts. Check current rates and hours before booking.
        </p>
      </div>
    </section>
  );
}
