import ParkingAuctionOriginPart1, {
  metadata as parkingAuctionOriginPart1Metadata
} from "./parking-auction-origin-part-1.mdx";
import ParkingAuctionRealityPart2, {
  metadata as parkingAuctionRealityPart2Metadata
} from "./parking-auction-reality-part-2.mdx";
import ParkingAuctionTurningPointPart3, {
  metadata as parkingAuctionTurningPointPart3Metadata
} from "./parking-auction-turning-point-part-3.mdx";

export const allPosts = [
  {
    slug: "parking-auction-origin-part-1",
    ...parkingAuctionOriginPart1Metadata,
    Content: ParkingAuctionOriginPart1
  },
  {
    slug: "parking-auction-reality-part-2",
    ...parkingAuctionRealityPart2Metadata,
    Content: ParkingAuctionRealityPart2
  },
  {
    slug: "parking-auction-turning-point-part-3",
    ...parkingAuctionTurningPointPart3Metadata,
    Content: ParkingAuctionTurningPointPart3
  }
];
