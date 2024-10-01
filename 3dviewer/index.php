<?php
/*
Plugin Name:  	3D Viewer Plugin
Description:  	This plugin displays "3D VIEW" when the '3dviewer' parameter is present in the URL.
Version: 	  	1.0
Author:		  	Rolesh
License:      	GPL2
License URI:  	https://www.gnu.org/licenses/gpl-2.0.html
Text Domain:  	wpb-tutorial
*/



/**
 * 
 * 
 * Short Code for 3D Viewer
 */

function gviewer_shortcode($atts)
{
    $atts = shortcode_atts(
        array(
            'file' => '',
            'width' => '300',
            'height' => '300',
        ),
        $atts,
        'gviewer'
    );
    $file = esc_url($atts['file']);
    $width = esc_attr($atts['width']);
    $height = esc_attr($atts['height']);

    if (empty($file)) {
        return '<p>Please provide a file URL.</p>';
    }

    ob_start();
?>

<?php
    return ob_get_clean();
}
add_shortcode('gViewer', 'gviewer_shortcode');
// Enqueue necessary scripts and styles


function enqueue_bootstrap()
{
    // Enqueue jQuery from CDN
    wp_enqueue_script('jquery', 'https://code.jquery.com/jquery-3.6.1.min.js', array(), null, true);

    // Enqueue Bootstrap CSS
    wp_enqueue_style('bootstrap-css', 'https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css');

    // Enqueue Bootstrap Bundle JS (includes Popper.js)
    wp_enqueue_script('bootstrap-js', 'https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.bundle.min.js', array('jquery'), null, true);
    // 
}
add_action('wp_enqueue_scripts', 'enqueue_bootstrap');

function custom_3d_viewer_enqueue_scripts()
{
    wp_enqueue_script('jquery');
    wp_enqueue_script('custom-3d-viewer', plugin_dir_url(__FILE__) . 'js/custom-3d-viewer.js', array('jquery'), 5.8, true);
}
add_action('wp_enqueue_scripts', 'custom_3d_viewer_enqueue_scripts');

function three_scripts()
{
    wp_enqueue_style('custom3d-css', plugin_dir_url(__FILE__) . 'assets/custom3dviewer.css', array(), 3.0);
    wp_enqueue_script('three_scripts', plugin_dir_url(__FILE__) . 'js/three.js', array('jquery'), null, true);
    wp_enqueue_script('draco_loader', plugin_dir_url(__FILE__) . 'js/DRACOLoader.js', array('jquery'), null, true);
    wp_enqueue_script('stl_loader', plugin_dir_url(__FILE__) . 'js/STLLoader.js', array('jquery'), null, true);
    wp_enqueue_script('ply_loader', plugin_dir_url(__FILE__) . 'js/PLYLoader.js', array('jquery'), null, true);
    // wp_enqueue_script('arcball_controller', plugin_dir_url(__FILE__) . 'js/ArcballControls.js', array('jquery'), null, true);
    // wp_enqueue_script('orbit_controller', plugin_dir_url(__FILE__) . 'js/OrbitControls.js', array('jquery'), null, true);
    wp_enqueue_script('trackball_controller', plugin_dir_url(__FILE__) . 'js/TrackballControls.js', array('jquery'), null, true);
    wp_enqueue_script('transform_controller', plugin_dir_url(__FILE__) . 'js/TransformControls.js', array('jquery'), null, true);
    wp_enqueue_script('zip_controller', 'https://cdn.jsdelivr.net/npm/jszip@3.7.1/dist/jszip.min.js', array('jquery'), null, true);
}
add_action('wp_enqueue_scripts', 'three_scripts');

function exporter_scripts()
{
    wp_enqueue_script('ply_exporter', plugin_dir_url(__FILE__) . 'js/PLYExporter.js', array('jquery'), null, true);
    wp_enqueue_script('stl_exporter', plugin_dir_url(__FILE__) . 'js/STLExporter.js', array('jquery'), null, true);
}
add_action('wp_enqueue_scripts', 'exporter_scripts');

// Add the button to the PeepSo chat interface
function peepso_3d_viewer_add_button()
{
    echo '<button class="peepso-3d-view-button">View 3D Model</button>';
}
// add_action('peepso_activity_post_attachment', 'peepso_3d_viewer_add_button');

function mytheme_add_3d_model_modal()
{
?>
    <style>
        .modal-custom-inner .modal-content {
            z-index: 100001 !important;
            width: 100% !important;
            top: 50%;
            transform: translate(0, -50%) !important;
        }

        .modal-custom-inner {
            top: 50%;
            transform: translate(0, -50%) !important;
            margin: 0 !important;
        }

        .modal-custom-3d {
            position: fixed;
            width: 100% !important;
            height: 100vh !important;
            display: flex !important;
            justify-content: center;
            top: 0 !important;
            background-color: rgba(0, 0, 0, 0.4) !important;
			z-index: 100000 !important;
            padding: 0 !important;
        }

        .modal-custom-3d .modal-header {
            padding: 20px !important;
        }

        #myModalLabel {
            font-size: 1.5em !important;
        }

		.hide {
			display: none!important;
		}

        .modal-dialog {
            display: flex;
            justify-content: center;
            align-items: center;
        }
        @media (max-width: 575px) {
            .modal-dialog {
                width: 100vw!important;
            }

            .slider_window {
                position: static!important;
                width: 100%!important;
            }
            .save_btn {
                top:10px;
                left: 10px;
                bottom:auto!important;
                width: 70px;
                height: 34px;
                font-size: 12px !important;
                padding: 0!important;
            }

            .close {
                margin: 20px!important;
            }
        }

        /* Small Devices (landscape phones, 576px and up) */
        @media (min-width: 576px) and (max-width: 767px) {
            .modal-dialog {
                width: 100vw!important;
            }

            .slider_window {
                position: static!important;
                width: 100%!important;
            }
            .save_btn {
                top:10px;
                left: 10px;
                bottom:auto!important;
                width: 70px;
                height: 34px;
                font-size: 12px !important;
                padding: 0!important;
            }

            .close {
                margin: 20px!important;
            }
        }

        /* Medium Devices (tablets, 768px and up) */
        @media (min-width: 768px) and (max-width: 991px) {
            .modal-content {
                width: 100%;
            }
            .slider_window {
                position: static!important;
                width: 100%!important;
            }
            .save_btn {
                top:10px;
                left: 10px;
                bottom:auto!important;
                width: 70px;
                height: 34px;
                font-size: 12px !important;
                padding: 0!important;
            }
        }

        /* Large Devices (desktops, 992px and up) */
        @media (min-width: 992px) and (max-width: 1199px) {
            .modal-content {
                width: 100%;
            }
            
            /* .modal_close {
                margin:15px!important;
            } */
        }

        /* Extra Large Devices (large desktops, 1200px and up) */
        @media (min-width: 1200px) {
            .modal-content {
                width: 100%;
            }
            .modal-dialog {
                width: 100%;
            }
        }

        /* @media only screen and (max-width: 1400px) {
            
        } */
		
        /* @media only screen and (min-width: 992px) {
            .modal-custom-inner {
                width: 60% !important;
                height: 70vh !important;
            }
        }

        @media only screen and  (min-width: 992px) {
            .modal-lg,
            .modal-xl {
                max-width: 60%;
            }
        }

        @media only screen and  (min-width: 576px) {
            .modal-dialog {
                max-width: 75%;
            }
        }

        @media only screen and  (max-width:650px) {
            .modal-dialog {
                width: 100% !important;
            }

            .modal-custom-3d {
                margin: auto !important;
            }
        }

        @media only screen and  (min-width: 650px) {
            .modal-custom-inner {
                width: 60% !important;
            }
        } */
        #rDecodeconfirmModal {
            background-color: rgba(33, 33, 33, 0.4);
        }
        .decoded_modal_content {
            position: relative;
            width: 450px;
            height: 200px;
            top: 30%;
            left: calc(50% - 225px);
            padding: 20px;
            background-color: white;
            box-shadow: 5px 5px 5px #666;
            border-radius: 5px;
        }
        .decoded_modal_content p {
            font-weight: bolder;
            font-size: 20px;
            margin-top: 20px
        }
        #rDecodeconfirmModal button {
            width : 30%;
            margin: 20px;
        }
        .slider_window {
            width: 22%;
            position: absolute;
            top: 10px;
            left: 10px;
            box-shadow: 1px 1px rgb(244, 244, 244);
            padding: 5px 10px;
            border-radius: 15px;
        }    
        .slider-container {
            display: flex;
            align-items: center;
        }

        .custom_slider {
            width: 165px;
            -webkit-appearance: none; /* For Chrome, Safari, Opera */
            appearance: none;
            height: 2px;
            background: #ccc;
            border-radius: 5px;
            outline: none;
            opacity: 0.7;
            transition: opacity 0.2s;
            margin: 0 10px; /* Adds spacing between elements */
            margin-left: 20px;
        }

        .custom_slider:hover {
            opacity: 1;
        }

        .custom_slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 11px; /* Double the original width */
            height: 17px;
            background: #ffffff;
            border-radius: 0; /* Make the thumb square */
            box-shadow: 1px 1px rgb(88, 88, 88);
            cursor: pointer;
        }

        .slider_window {
            background-color: #F4F3F5;
            width: 242px;
            height: 245px;
        }

        .icon {
            display: flex;
            align-items: center;
        }

        .icon img {
            width: 30px;
            height: 30px;
            margin-right: 10px; /* Adds spacing between icon and value */
        }

        .slider_value {
            font-size: 12px;
            margin-right:10px;
        }    
        .save_btn {
            position: absolute;
            bottom: 70px;
            left:10px;
            display: none;
        }
        #View3DModal {
            display: none;
        }
       
    </style>
    <!-- Modal HTML Structure -->
    <div class="modal-custom-3d hide" id="View3DModal">        
        <div class="modal-dialog modal-lg modal-custom-inner" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="myModalLabel">3D Model Viewer</h5>
                    <button type="button" class="close modal_close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div style = "position: relative">
                    <div class="loadingScreen">
                        <img class="gif-image" src=<?php echo plugin_dir_url(__FILE__) . 'js/icon/loading.gif' ?> alt="Loading...">
                    </div>
                    <div class="transform_changer">
                        T
                    </div>
                    <div class="modal-body" id="modelContainer" style="padding: 0px">
                        
                    </div>
                    <input type="button" onclick="saveNewInfo(event)" id="xmlSave" class="save_btn" value="export" />
                    <div class="camera_controller">
                        <img src=<?php echo plugin_dir_url(__FILE__) . 'assets/left.png' ?> class="rightbtn" onclick = "setCameraPosition(event)">
                        <img src=<?php echo plugin_dir_url(__FILE__) . 'assets/up.png' ?> class="upbtn" onclick = "setCameraPosition(event)">
                        <img src=<?php echo plugin_dir_url(__FILE__) . 'assets/front.png' ?> class="frbtn" onclick = "setCameraPosition(event)">
                        <img src=<?php echo plugin_dir_url(__FILE__) . 'assets/up.png' ?> class="downbtn" onclick = "setCameraPosition(event)">
                        <img src=<?php echo plugin_dir_url(__FILE__) . 'assets/left.png' ?> class="leftbtn" onclick = "setCameraPosition(event)">
                    </div>
                    <div class = "animationController">
                        <button class="active up-btn">U</button>
                        <button class="active lo-btn">L</button>
                        <button class="meshPlayBtn"><i class='gcis gci-play'></i></button>
                        <input type = "range" min = "0" max = "50" class="animateSlider">
                        <div style="display:inline-block; position: relative; top: -3px">
                            <span class="currentStep">1</span>/<span class="maxStep">50</span>
                        </div>
                    <div class="slider_window hide">
                        <p>Object Movements</p>
                        <p>ToothNumber: #<span id="toothNumber"></span></p>
                        <div class="slider-container">
                            <div class="icon">
                               <img src=<?php echo plugin_dir_url(__FILE__) . 'assets/move_x.png' ?> class="rightbtn" alt="icon" />
                            <span id="move_x_slider_value" class="slider_value">0</span>
                            </div>
                            <input type="range" class="custom_slider" id="move_x_slider" min=-0.50 max=0.50 step=0.01 value=0 onchange="document.getElementById('move_x_slider_value').textContent = this.value" oninput="document.getElementById('move_x_slider_value').textContent = this.value">
                        </div>
                        <div class="slider-container">
                            <div class="icon">
                               <img src=<?php echo plugin_dir_url(__FILE__) . 'assets/move_y.png' ?> class="rightbtn" alt="icon" />
                            <span id="move_y_slider_value" class="slider_value">0</span>
                            </div>
                            <input type="range" class="custom_slider" id="move_y_slider" min="-0.50" max="0.50" step="0.01" value="0" onchange="document.getElementById('move_y_slider_value').textContent = this.value" oninput="document.getElementById('move_y_slider_value').textContent = this.value">
                        </div>
                        <div class="slider-container">
                            <div class="icon">
                               <img src=<?php echo plugin_dir_url(__FILE__) . 'assets/move_z.png' ?> class="rightbtn" alt="icon" />
                            <span id="move_z_slider_value" class="slider_value">0</span>
                            </div>
                            <input type="range" class="custom_slider" id="move_z_slider" min="-0.50" max="0.50" step="0.01" value="0" onchange="document.getElementById('move_z_slider_value').textContent = this.value" oninput="document.getElementById('move_z_slider_value').textContent = this.value">
                        </div>
                        <div class="slider-container">
                            <div class="icon">
                               <img src=<?php echo plugin_dir_url(__FILE__) . 'assets/rotate_y.png' ?> class="rightbtn" alt="icon" />
                            <span id="rotate_x_slider_value" class="slider_value">0</span>
                            </div>
                            <input type="range" class="custom_slider" id="rotate_x_slider"min="-5" max="5" step="0.1"  value="0" onchange="document.getElementById('rotate_x_slider_value').textContent = this.value" oninput="document.getElementById('rotate_x_slider_value').textContent = this.value"/>
                        </div>
                        <div class="slider-container">
                            <div class="icon">
                               <img src=<?php echo plugin_dir_url(__FILE__) . 'assets/rotate_z.png' ?> class="rightbtn" alt="icon" />
                            <span id="rotate_y_slider_value" class="slider_value">0</span>
                            </div>
                            <input type="range" class="custom_slider" id="rotate_y_slider" min="-5" max="5" step="0.1"  value="0"  onchange="document.getElementById('rotate_y_slider_value').textContent = this.value" oninput="document.getElementById('rotate_y_slider_value').textContent = this.value"/>
                        </div>
                        <div class="slider-container">
                            <div class="icon">
                               <img src=<?php echo plugin_dir_url(__FILE__) . 'assets/rotate_x.png' ?> class="rightbtn" alt="icon" />
                            <span id="rotate_z_slider_value" class="slider_value">0</span>
                            </div>
                            <input type="range" class="custom_slider" id="rotate_z_slider" min="-5" max="5" step="0.1" value="0" oninput="document.getElementById('rotate_z_slider_value').textContent = this.value" onchange="document.getElementById('rotate_z_slider_value').textContent = this.value"/>
                        </div>
                    </div>
                    </div>
                    
                </div>
            </div>
        </div>
    </div>
    <div id="rDecodeconfirmModal" class="modal hide">
        <div class="decoded_modal_content">
        <p>Do you want to download decoded file?</p>
        <p>
            <button id="confirmDecodeYes">Yes</button>
            <button id="confirmDecodeNo" style="float: right">No</button>
        </p>
        </div>
  </div>
<?php
}

add_action('wp_footer', 'mytheme_add_3d_model_modal');

function view_custom3d_models() {
    ?>
    <script type="text/javascript">
        jQuery(document).ready(function ($) {
            let shortcodeModelContainers = $(".customized3dViewer")
            for(let counter = 0; counter < shortcodeModelContainers.length; counter++) {
                view3DModelR(shortcodeModelContainers[counter].getAttribute("data-url"), shortcodeModelContainers[counter]);
            }
        });
    </script>
    <?php
}

add_action('wp_footer', 'view_custom3d_models');
?>
