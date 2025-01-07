<script>
    import { onMount } from "svelte";

    onMount(() => {
        //  set up the listener for CABLES loader
        console.log("loading cables...");
        document.addEventListener("CABLES.jsLoaded", function (event) {
            CABLES.patch = new CABLES.Patch({
                patchFile: "webview://cables-ui/js/cables-ui.json",
                prefixAssetPath: "webview://cables-ui",
                assetPath: "webview://cables-ui/assets/",
                jsPath: "webview://cables-ui/js/",
                glCanvasId: "glcanvas",
                glCanvasResizeToWindow: true,
                onError: (e) => console.error(e),
                onPatchLoaded: () => console.count("Patch loaded"),
                onFinishedLoading: () => {
                    console.count("UI finished loading");
                },
                canvas: {
                    willReadFrequently: true,
                    alpha: false,
                    premultipliedAlpha: true,
                },
            });
        });
    });
</script>

<canvas id="glcanvas" width="400px" height="400px" >

</canvas>