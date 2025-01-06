#![feature(lock_value_accessors)]

// Forked and modified from: https://github.com/robbert-vdh/nih-plug/tree/master/plugins/examples/gain
use nih_plug::prelude::*;
use nih_plug_webview::*;
use serde::Deserialize;
use serde_json::json;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use include_dir::{include_dir, Dir};
use nih_plug_webview::http::Response;

static WEB_ASSETS: Dir<'_> = include_dir!("/Users/cristianvogel/Desktop/Programming/rust-wv-plugin/example/src/dist/cables-ui/js");

struct Gain {
    params: Arc<GainParams>,
}

#[derive(Deserialize)]
#[serde(tag = "type")]
enum Action {
    Init,
    SetSize { width: u32, height: u32 },
    SetGain { value: f32 },
    PersistedStateForUI {},
    SetKeyPresses { value: u32 },
}

#[derive(Params)]
struct GainParams {

    #[id = "gain"]
    pub gain: FloatParam,

    #[persist = "keyPresses"]
    pub key_presses: Mutex<i32> ,

    gain_value_changed: Arc<AtomicBool>,
}

impl Default for Gain {
    fn default() -> Self {
        Self {
            params: Arc::new(GainParams::default()),
        }
    }
}

impl Default for GainParams {
    fn default() -> Self {
        let gain_value_changed = Arc::new(AtomicBool::new(false));

        let v = gain_value_changed.clone();
        let param_callback = Arc::new(move |_: f32| {
            v.store(true, Ordering::Relaxed);
        });

        Self {

            gain: FloatParam::new(
                "Gain",
                util::db_to_gain(0.0),
                FloatRange::Skewed {
                    min: util::db_to_gain(-30.0),
                    max: util::db_to_gain(30.0),
                    factor: FloatRange::gain_skew_factor(-30.0, 30.0),
                },
            )
            .with_smoother(SmoothingStyle::Logarithmic(50.0))
            .with_unit(" dB")
            .with_value_to_string(formatters::v2s_f32_gain_to_db(2))
            .with_string_to_value(formatters::s2v_f32_gain_to_db())
            .with_callback(param_callback.clone()),

            key_presses: Mutex::new(i32::default()).into(),
            gain_value_changed,
        }
    }
}

impl Plugin for Gain {
    const NAME: &'static str = "Gain";
    const VENDOR: &'static str = "Moist Plugins GmbH";

    const URL: &'static str = "";
    const EMAIL: &'static str = "info@example.com";
    const VERSION: &'static str = "0.0.1";
    const AUDIO_IO_LAYOUTS: &'static [AudioIOLayout] = &[
        AudioIOLayout {
            main_input_channels: NonZeroU32::new(2),
            main_output_channels: NonZeroU32::new(2),
            aux_input_ports: &[],
            aux_output_ports: &[],
            names: PortNames::const_default(),
        },
        AudioIOLayout {
            main_input_channels: NonZeroU32::new(1),
            main_output_channels: NonZeroU32::new(1),
            ..AudioIOLayout::const_default()
        },
    ];

    const MIDI_INPUT: MidiConfig = MidiConfig::None;

    const SAMPLE_ACCURATE_AUTOMATION: bool = true;

    type SysExMessage = ();
    type BackgroundTask = ();

    fn params(&self) -> Arc<dyn Params> {
        self.params.clone()
    }

    fn editor(&mut self, _async_executor: AsyncExecutor<Self>) -> Option<Box<dyn Editor>> {
        let params = self.params.clone();
        let gain_value_changed = self.params.gain_value_changed.clone();
        let editor = WebViewEditor::new(HTMLSource::String(include_str!("dist/index.html")), (800, 600))
            .with_custom_protocol("webview".to_owned(), |req| {
                if let Some(file) = WEB_ASSETS.get_file(req.uri().path().trim_start_matches("/")) {
                    return Response::builder()
                        .header(
                            "content-type",
                            match file.path().extension().unwrap().to_str().unwrap() {
                                "js" => "text/javascript",
                                "css" => "text/css",
                                "ttf" => "font/ttf",
                                _ => "",
                            },
                        )
                        .header("Access-Control-Allow-Origin", "*")
                        .body(file.contents().into())
                        .map_err(Into::into);
                }
                panic!("Web asset not found.")
            })
            .with_background_color((150, 150, 150, 255))
            .with_developer_mode(true)
            .with_keyboard_handler(move |event| {
                println!("keyboard event: {event:#?}");
                event.key == Key::Escape
            })
            .with_mouse_handler(|event| match event {
                MouseEvent::DragEntered { .. } => {
                    println!("drag entered");
                    EventStatus::AcceptDrop(DropEffect::Copy)
                }
                MouseEvent::DragMoved { .. } => {
                    println!("drag moved");
                    EventStatus::AcceptDrop(DropEffect::Copy)
                }
                MouseEvent::DragLeft => {
                    println!("drag left");
                    EventStatus::Ignored
                }
                MouseEvent::DragDropped { data, .. } => {
                    if let DropData::Files(files) = data {
                        println!("drag dropped: {:?}", files);
                    }
                    EventStatus::AcceptDrop(DropEffect::Copy)
                }
                _ => EventStatus::Ignored,
            })
            .with_event_loop(move |ctx, setter, window| {
                while let Ok(value) = ctx.next_event() {
                    if let Ok(action) = serde_json::from_value(value) {
                        match action {
                            Action::SetGain { value } => {
                                setter.begin_set_parameter(&params.gain);
                                setter.set_parameter_normalized(&params.gain, value);
                                setter.end_set_parameter(&params.gain);
                            }
                            Action::SetSize { width, height } => {
                                ctx.resize(window, width, height);
                            }
                            Action::Init => {
                                ctx.send_json(json!({
                                    "type": "set_size",
                                    "width": ctx.width.load(Ordering::Relaxed),
                                    "height": ctx.height.load(Ordering::Relaxed)
                                }));
                            }
                            Action::PersistedStateForUI {} => {
                                // need to do one by one, as our params are wrapped in Arc
                                ctx.send_json(json!({
                                    "type": "param_change",
                                    "name": "gain",
                                    "value": params.gain.unmodulated_normalized_value(),
                                    "text": params.gain.to_string()
                                }));
                                ctx.send_json(json!({
                                    "type": "persisted",
                                    "name": "keyPresses",
                                    "value": params.key_presses,
                                    "text": "key presses:"
                                }));
                            }
                            Action::SetKeyPresses { value } => {
                                nih_log!("KeyPresses: {}", value);
                                params.key_presses.set(value as i32).unwrap();
                            }
                        }
                    } else {
                        panic!("Invalid action received from web UI.")
                    }
                }

                if gain_value_changed.swap(false, Ordering::Relaxed) {
                    ctx.send_json(json!({
                        "type": "param_change",
                        "name": "gain",
                        "value": params.gain.modulated_normalized_value(),
                        "text": params.gain.to_string()
                    }));
                }
            });

        Some(Box::new(editor))
    }

    fn process(
        &mut self,
        buffer: &mut Buffer,
        _aux: &mut AuxiliaryBuffers,
        _context: &mut impl ProcessContext<Self>,
    ) -> ProcessStatus {
        for channel_samples in buffer.iter_samples() {
            let gain = self.params.gain.smoothed.next();

            for sample in channel_samples {
                *sample *= gain;
            }
        }

        ProcessStatus::Normal
    }

    fn deactivate(&mut self) {}
}

impl ClapPlugin for Gain {
    const CLAP_ID: &'static str = "com.moist-plugins-gmbh.gain";
    const CLAP_DESCRIPTION: Option<&'static str> = Some("A smoothed gain parameter example plugin");
    const CLAP_MANUAL_URL: Option<&'static str> = Some(Self::URL);
    const CLAP_SUPPORT_URL: Option<&'static str> = None;
    const CLAP_FEATURES: &'static [ClapFeature] = &[
        ClapFeature::AudioEffect,
        ClapFeature::Stereo,
        ClapFeature::Mono,
        ClapFeature::Utility,
    ];
}

impl Vst3Plugin for Gain {
    const VST3_CLASS_ID: [u8; 16] = *b"GainMoistestPlug";
    const VST3_SUBCATEGORIES: &'static [Vst3SubCategory] =
        &[Vst3SubCategory::Fx, Vst3SubCategory::Tools];
}

nih_export_clap!(Gain);
nih_export_vst3!(Gain);
