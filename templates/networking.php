<div class="row">
  <div class="col-lg-12">
   <div class="card">
    <div class="card-header">
      <div class="row">
        <div class="col">
          <i class="fas fa-network-wired mr-2"></i><?php echo _("Configure networking"); ?>
        </div>
      </div><!-- ./row -->
     </div><!-- ./card-header -->
      <div class="card-body">
        <div id="msgNetworking"></div>
        <ul class="nav nav-tabs">
          <li role="presentation" class="nav-item"><a class="nav-link active" href="#summary" aria-controls="summary" role="tab" data-toggle="tab"><?php echo _("Summary"); ?></a></li>
          <?php foreach ($configurable_interfaces as $if): ?>
          <?php $if_quoted = htmlspecialchars($if, ENT_QUOTES) ?>
          <li role="presentation" class="nav-item"><a class="nav-link" href="#<?php echo $if_quoted ?>" aria-controls="<?php echo $if_quoted ?>" role="tab" data-toggle="tab"><?php echo $if_quoted ?></a></li>
          <?php endforeach ?>
        </ul>
        <div class="tab-content">

          <div role="tabpanel" class="tab-pane active" id="summary">
            <h4 class="my-3"><?php echo _("Current settings") ?></h4>
            <div class="row">
              <?php foreach ($all_interfaces as $if): ?>
              <?php $if_quoted = htmlspecialchars($if, ENT_QUOTES) ?>
              <div class="col-md-6 mb-3">
                <div class="card">
                  <div class="card-header"><?php echo $if_quoted ?></div>
                  <div class="card-body">
                    <pre class="unstyled" id="<?php echo $if_quoted ?>-summary"></pre>
                  </div>
                </div>
              </div>
              <?php endforeach ?>
            </div><!-- /.row -->
            <div class="col-lg-12">
              <div class="row">
                <a href="#" class="btn btn-outline-primary" id="btnSummaryRefresh"><i class="fas fa-sync-alt"></i> <?php echo _("Refresh"); ?></a>
              </div><!-- /.row -->
            </div><!-- /.col-lg-12 -->
          </div><!-- /.tab-pane -->

          <?php foreach ($configurable_interfaces as $if): ?>
          <?php $if_quoted = htmlspecialchars($if, ENT_QUOTES) ?>
          <div role="tabpanel" class="tab-pane fade in" id="<?php echo $if_quoted ?>">
            <div class="row">
              <div class="col-lg-6">
                <form id="frm-<?php echo $if_quoted ?>">
                  <?php echo CSRFTokenFieldTag() ?>
                  <div class="form-group">
                    <h4 class="mt-3 mb-3"><?php echo _("Adapter IP Address Settings") ?></h4>
                    <div id="<?php echo $if_quoted ?>-mode-toggle" class="btn-group btn-group-toggle" role="group" data-toggle="buttons">
                      <label class="btn btn-outline-primary">
                        <input class="mr-2" type="radio" name="<?php echo $if_quoted ?>-addresstype" id="<?php echo $if_quoted ?>-dhcp" autocomplete="off"><?php echo _("DHCP") ?>
                      </label>
                      <label class="btn btn-outline-primary">
                        <input class="mr-2" type="radio" name="<?php echo $if_quoted ?>-addresstype" id="<?php echo $if_quoted ?>-static" autocomplete="off"><?php echo _("Static IP") ?>
                      </label>
                    </div><!-- /.btn-group -->
                  </div><!-- /.form-group -->

                  <hr />

                  <h4><?php echo _("Static IP Options") ?></h4>
                  <div class="form-group">
                    <label for="<?php echo $if_quoted ?>-ipaddress"><?php echo _("IP Address") ?></label>
                    <input type="text" class="form-control" id="<?php echo $if_quoted ?>-ipaddress" placeholder="0.0.0.0">
                    <span class="error" id="<?php echo $if_quoted ?>-ipaddress-empty">This field cannot be empty</span>
                    <span class="error" id="<?php echo $if_quoted ?>-ipaddress-invalid">This field must contain a valid IP address</span>
                  </div>
                  <div class="form-group">
                    <label for="<?php echo $if_quoted ?>-netmask"><?php echo _("Subnet Mask") ?></label>
                    <input type="text" class="form-control" id="<?php echo $if_quoted ?>-netmask" placeholder="255.255.255.255">
                    <span class="error" id="<?php echo $if_quoted ?>-netmask-empty">This field cannot be empty</span>
                    <span class="error" id="<?php echo $if_quoted ?>-netmask-invalid">This field must contain a valid netmask</span>
                  </div>
                  <div class="form-group">
                    <label for="<?php echo $if_quoted ?>-gateway"><?php echo _("Default Gateway") ?></label>
                    <input type="text" class="form-control" id="<?php echo $if_quoted ?>-gateway" placeholder="0.0.0.0">
                    <span class="error" id="<?php echo $if_quoted ?>-gateway-empty">This field cannot be empty</span>
                    <span class="error" id="<?php echo $if_quoted ?>-gateway-invalid">This field must contain a valid IP address</span>
                  </div>
                  <div class="form-group">
                    <label for="<?php echo $if_quoted ?>-dnssvr"><?php echo _("Primary DNS") ?></label>
                    <input type="text" class="form-control" id="<?php echo $if_quoted ?>-dnssvr" placeholder="0.0.0.0">
                    <span class="error" id="<?php echo $if_quoted ?>-dnssvr-empty">This field cannot be empty</span>
                    <span class="error" id="<?php echo $if_quoted ?>-dnssvr-invalid">This field must contain a valid IP address</span>
                  </div>
                  <div class="form-group">
                    <label for="<?php echo $if_quoted ?>-dnssvralt"><?php echo _("Secondary DNS"); echo _(" (optional)") ?></label>
                    <input type="text" class="form-control" id="<?php echo $if_quoted ?>-dnssvralt" placeholder="0.0.0.0">
                    <span class="error" id="<?php echo $if_quoted ?>-dnssvralt-invalid">This field must contain a valid IP address</span>
		              </div>
                  <?php if (!RASPI_MONITOR_ENABLED): ?>
		                  <a href="#" class="btn btn-primary intapply" data-int="<?php echo $if_quoted ?>"><?php echo _("Apply settings") ?></a>
                      <a href="#" class="btn btn-warning intreset" data-int="<?php echo $if_quoted ?>"><?php echo _("Discard changes") ?></a>
                  <?php endif ?>
                </form>

              </div>
            </div><!-- /.tab-panel -->
          </div>
          <?php endforeach ?>

        </div><!-- /.tab-content -->
      </div><!-- /.card-body -->
      <div class="card-footer"><?php echo _("Information provided by ip and netplan"); ?></div>
    </div><!-- /.card -->
  </div><!-- /.col-lg-12 -->
</div>
