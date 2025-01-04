use std::path::{Path, PathBuf};
use fs_extra::dir::{copy, CopyOptions};

fn main() -> nih_plug_xtask::Result<()> {
    nih_plug_xtask::main().expect("Failed to build bundles!");

    // Relative paths from the project root (where your Cargo.toml for xtask is):
    let clap_bundle_source: PathBuf = ["target", "bundled", "gain.clap"].iter().collect();
    let vst3_bundle_source: PathBuf = ["target", "bundled", "gain.vst3"].iter().collect();
    let clap_destination = Path::new("/Library/Audio/Plug-Ins/CLAP"); // Or your preferred location
    let vst3_destination = Path::new("/Library/Audio/Plug-Ins/VST3"); // Or your preferred location

    // Use fs_extra to copy directories:
    let mut options = CopyOptions::new();
    options.overwrite = true; // Or handle existing files differently
    copy(clap_bundle_source, clap_destination, &options)?;
    println!("Copied CLAP bundle to {:?}", clap_destination);

    copy(vst3_bundle_source, vst3_destination, &options)?;
    println!("Copied VST3 bundle to {:?}", vst3_destination);

    Ok(())
}
