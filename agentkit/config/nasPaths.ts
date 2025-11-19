export interface ProjectNasConfig {
  root: string;
  media: string;
  edits: string;
  generative?: string;
}

export interface NasConfig {
  baseMount: string;
  projects: {
    SkySky: ProjectNasConfig;
    RufusGold: ProjectNasConfig;
    SoulSyntax: ProjectNasConfig;
    SteadyStream: ProjectNasConfig;
  };
}

export const nasConfig: NasConfig = {
  baseMount: "/Volumes/QNAP",
  projects: {
    SkySky: {
      root: "/Volumes/QNAP/SkyRas/SkySky",
      media: "/Volumes/QNAP/SkyRas/SkySky/Media",
      edits: "/Volumes/QNAP/SkyRas/SkySky/Edits",
      generative: "/Volumes/QNAP/SkyRas/SkySky/Generative",
    },
    RufusGold: {
      root: "/Volumes/QNAP/SkyRas/RufusGold",
      media: "/Volumes/QNAP/SkyRas/RufusGold/Media",
      edits: "/Volumes/QNAP/SkyRas/RufusGold/Edits",
    },
    SoulSyntax: {
      root: "/Volumes/QNAP/SkyRas/SoulSyntax",
      media: "/Volumes/QNAP/SkyRas/SoulSyntax/Media",
      edits: "/Volumes/QNAP/SkyRas/SoulSyntax/Edits",
    },
    SteadyStream: {
      root: "/Volumes/QNAP/SkyRas/SteadyStream",
      media: "/Volumes/QNAP/SkyRas/SteadyStream/Media",
      edits: "/Volumes/QNAP/SkyRas/SteadyStream/Edits",
    },
  },
};
