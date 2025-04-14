//carouselData.tsx

import PlumberIcon from "../assets/icons/plumbing_services.svg";
import ElectricianIcon from "../assets/icons/electrical_services.svg";

export function getCarouselImages() {
  return [
    { Icon: PlumberIcon, title: "Plumber" },
    { Icon: ElectricianIcon, title: "Electrician" },
  ];
}
