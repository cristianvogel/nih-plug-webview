use std::path::{Path, PathBuf};
use std::process::Command;
use fs_extra::dir::{copy, CopyOptions};

fn main() -> nih_plug_xtask::Result<()> {

    // Step 1: Call the pre-build.js script
    let status = Command::new("node")
        .arg(" ../../ui/scripts/pre-build.js") // Path to (pre) vite build script from example folder
        .status()
        .expect("Failed to execute the pre-build.js script");

    if !status.success() {
        eprintln!("pre-build.js script failed to run.");
        std::process::exit(status.code().unwrap_or(1));
    }

    println!("Successfully executed pre-build.js");

    // now bundle!
    nih_plug_xtask::main().expect("Failed to build bundles!");

    // Relative paths from the project root
    let clap_bundle_source: PathBuf = ["target", "bundled", "gain.clap"].iter().collect();
    let vst3_bundle_source: PathBuf = ["target", "bundled", "gain.vst3"].iter().collect();
    // MacOS: copy the bundles to library - make sure these folders actually exist
    let clap_destination = Path::new("/Library/Audio/Plug-Ins/CLAP");
    let vst3_destination = Path::new("/Library/Audio/Plug-Ins/VST3");

    let mut options = CopyOptions::new();
    options.overwrite = true; // Or handle existing files differently
    copy(clap_bundle_source, clap_destination, &options)?;
    println!("Copied CLAP bundle to {:?}", clap_destination);

    copy(vst3_bundle_source, vst3_destination, &options)?;
    println!("Copied VST3 bundle to {:?}", vst3_destination);

    Ok(())
}
