import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component } from '@angular/core';
import { WizardbackendService } from '../../../backend/wizardbackend.service';

@Component({
  selector: 'app-pythonanalyze',
  templateUrl: './pythonanalyze.component.html',
  styleUrls: ['./pythonanalyze.component.scss'],
})
export class PythonAnalyze {
  selectedCarrier: any = null;

  carrierId = '';
  filePart = '';
  response: string | null = null;
  carrierServer: any;
  error: string | null = null;
  isLoading = false;
  tabsBool = false;
  toastVisible = false;
  activeTab = 'carrierRequest'; // Default tab
  toastMessage = '';
  toastType = '';
  analyzedCarrier: string;
  activeCarrier: any = null;

  selectedModel = 'openai/chatgpt-4o-latest'; // Default model
  models = [
    { label: 'OpenAI GPT-4', value: 'openai/chatgpt-4o-latest' },
    { label: 'Qwen 2.5 Coder', value: 'qwen/qwen-2.5-coder-32b-instruct' },
    { label: 'DeepSeek V2.5', value: 'deepseek/deepseek-chat' },
  ];

  carrierspyt = [
    {
      number: '658',
      title: '0658 Airmee SE',
      urlPattern: 'airmee',
    },
    {
      number: '915',
      title: '0915 Amazon Shipping INT ',
      urlPattern: 'amazon',
    },
    {
      number: '275',
      title: '0275 Russian Post RU',
      urlPattern: 'an_post',
    },
    {
      number: '710',
      title: '0710 APC UK ',
      urlPattern: 'apc',
    },
    {
      number: '931',
      title: '0931 APG INT ',
      urlPattern: 'apg',
    },
    {
      number: '659',
      title: '0659 Arco Transport EE',
      urlPattern: 'arco_transport',
    },
    {
      number: '967',
      title: '0967 ArrowXL GB',
      urlPattern: 'arrow_xl',
    },
    {
      number: '621',
      title: '0621 Asendia INT',
      urlPattern: 'asendia',
    },
    {
      number: '254',
      title: '0254 Australia Post AU',
      urlPattern: 'australia_post',
    },
    {
      number: '489',
      title: '0489 B2C Europe UK ',
      urlPattern: 'b2c',
    },
    {
      number: '876',
      title: '0876 B-Logistics IE',
      urlPattern: 'b_logistics',
    },

    {
      number: '1012',
      title: '1012 Sending ES',
      urlPattern: 'sending',
    },
    {
      number: '35',
      title: '0035 Blue Water INT',
      urlPattern: 'blue_water',
    },
    {
      number: '850',
      title: '0850 BluJay GB',
      urlPattern: 'blujay',
    },
    {
      number: '755',
      title: '0755 Bollore FR',
      urlPattern: 'bol',
    },
    {
      number: '662',
      title: '0662 Boxberry RU',
      urlPattern: 'boxberry',
    },
    {
      number: '632',
      title: '0632 BPOST BE ',
      urlPattern: 'bpost',
    },
    {
      number: '36',
      title: '0036 Bring SE',
      urlPattern: 'bring',
    },
    {
      number: '441',
      title: '0441 Budbee SE',
      urlPattern: 'budbee',
    },
    {
      number: '643',
      title: '0643 Burd DK',
      urlPattern: 'burd',
    },
    {
      number: '822',
      title: '0822 CabApp Solutions FI',
      urlPattern: 'cabapp_solutions',
    },
    {
      number: '803',
      title: '0803 Canada Post CA',
      urlPattern: 'canada_post',
    },
    {
      number: '987',
      title: '0987 Canpar CA',
      urlPattern: 'canpar',
    },
    {
      number: '890',
      title: '0890 C.H.Robinson US',
      urlPattern: 'ch_robinson',
    },
    {
      number: '936',
      title: '0936 CheapCargo NL ',
      urlPattern: 'cheapcargo_nl',
    },
    {
      number: '394',
      title: '0394 Ciblex FR',
      urlPattern: 'ciblex_fr',
    },
    {
      number: '473',
      title: '0473 City Sprint UK',
      urlPattern: 'citysprint',
    },
    {
      number: '814',
      title: '0814 Colis PriveFR ',
      urlPattern: 'colis_prive',
    },
    {
      number: '629',
      title: '0629 Colissimo FR',
      urlPattern: 'colissimo',
    },
    {
      number: '807',
      title: '0807 Coll-8 Logistics IE',
      urlPattern: 'coll8_logistics',
    },
    {
      number: '396',
      title: '0396 Correos ES',
      urlPattern: 'correos_es',
    },
    {
      number: '823',
      title: '0823 Correos Express PT',
      urlPattern: 'correos_express_pt',
    },
    {
      number: '846',
      title: '0846 Croatian Post HR',
      urlPattern: 'croatian_post',
    },
    {
      number: '816',
      title: '0816 CSM Logistics GB',
      urlPattern: 'csm_logistics',
    },
    {
      number: '828',
      title: '0828 CTS NL',
      urlPattern: 'cts',
    },
    {
      number: '769',
      title: '0769 CTT Expresso INT',
      urlPattern: 'ctt_expresso',
    },
    {
      number: '891',
      title: '0891 Cycleon NL ',
      urlPattern: 'cycleon',
    },
    {
      number: '965',
      title: '0965 Cycloon NL',
      urlPattern: 'cycloon',
    },
    {
      number: '215',
      title: '0215 Deutsche Post DE ',
      urlPattern: 'deutsche_post',
    },
    {
      number: '727',
      title: '0727 D EXPRESS RS',
      urlPattern: 'dexpress',
    },
    {
      number: '337',
      title: '0337 DHL DE ',
      urlPattern: 'dhl_de',
    },
    {
      number: '972',
      title: '0972 DHL Freight API INT',
      urlPattern: 'dhl_freight/dhl_int/',
    },

    {
      number: '1001',
      title: '1001 DHL Freight API Denmark DK',
      urlPattern: 'dhl_freight/dhl_dk/',
    },

    {
      number: '977',
      title: '00000977.INT_FedEx_API',
      urlPattern: 'fedex_int',
    },

    {
      number: '281',
      title: '0281 DHL Global Forwarding FI',
      urlPattern: 'dhl_global_forwarding',
    },
    {
      number: '841',
      title: '0841 DHL MY',
      urlPattern: 'dhl_my',
    },
    {
      number: '844',
      title: '0844 DHL NL ',
      urlPattern: 'dhl_nl',
    },
    {
      number: '676',
      title: '0676 DHL Parcel Europe INT',
      urlPattern: 'dhl_parcel_europe',
    },
    {
      number: '973',
      title: '0973 - DHL Parcel Germany DE',
      urlPattern: 'dhl_parcel_germany',
    },
    {
      number: '221',
      title: '0221 DHL PL ',
      urlPattern: 'dhl_pl/dhl_parcel/',
    },

    {
      number: '887',
      title: '0887 Dooris SE ',
      urlPattern: 'dooris',
    },
    {
      number: '789',
      title: '0789 DPD AT',
      urlPattern: 'dpd_at',
    },
    {
      number: '230',
      title: '0230 DPD DE ',
      urlPattern: 'dpd_de',
    },
    {
      number: '927',
      title: '0927 DPD Global INT ',
      urlPattern: 'dpd_global',
    },
    {
      number: '802',
      title: '0802 DPD IE ',
      urlPattern: 'dpd_ie',
    },
    {
      number: '147',
      title: '0147 DPD PL ',
      urlPattern: 'dpd_pl',
    },
    {
      number: '764',
      title: '0764 DPD PT',
      urlPattern: 'dpd_pt',
    },
    {
      number: '13',
      title: '0013 DSV DK',
      urlPattern: 'dsv',
    },
    {
      number: '518',
      title: '0518 DTS PL',
      urlPattern: 'dts',
    },
    {
      number: '395',
      title: '0395 DX UK ',
      urlPattern: 'dx',
    },
    {
      number: '866',
      title: '0866 Dynalogic NL',
      urlPattern: 'dynalogic',
    },
    {
      number: '754',
      title: '0754 Early Bird SE',
      urlPattern: 'early_bird',
    },
    {
      number: '682',
      title: '0682 Easy2you AS NO',
      urlPattern: 'easy2you',
    },
    {
      number: '848',
      title: '0848 Econt BG',
      urlPattern: 'econt',
    },
    {
      number: '742',
      title: '0742 Eezery FI',
      urlPattern: 'eezery',
    },
    {
      number: '709',
      title: '0709 eSend FI',
      urlPattern: 'esend',
    },
    {
      number: '941',
      title: '0941 eShipper INT',
      urlPattern: 'eshipper',
    },
    {
      number: '717',
      title: '0717 Etrak UK',
      urlPattern: 'etrak_uk',
    },
    {
      number: '928',
      title: '0928 Evri INT ',
      urlPattern: 'evri',
    },
    {
      number: '985',
      title: '0985 Exporto INT',
      urlPattern: 'exporto',
    },
    {
      number: '966',
      title: '0966 Express One HU',
      urlPattern: 'express_one_hu',
    },
    {
      number: '310',
      title: '0310 Fan Courier RO',
      urlPattern: 'fan_courier',
    },
    {
      number: '139',
      title: '0139 Fedex INT',
      urlPattern: 'fedex_int',
    },
    {
      number: '801',
      title: '0801 Fedex PL',
      urlPattern: 'fedex_pl',
    },
    {
      number: '909',
      title: '0909 Fetch My Stuff FI',
      urlPattern: 'fetch_my_stuff',
    },
    {
      number: '665',
      title: '0665 Alan Firmin GB',
      urlPattern: 'firmin',
    },
    {
      number: '902',
      title: '0902 Foodora INT ',
      urlPattern: 'foodora',
    },
    {
      number: '794',
      title: '0794 Frayt US',
      urlPattern: 'frayt',
    },
    {
      number: '26',
      title: '0026 Freja Transport DK',
      urlPattern: 'freja',
    },
    {
      number: '771',
      title: '0771 GEL Express DE',
      urlPattern: 'gel_express',
    },
    {
      number: '788',
      title: '0788 Asda UK',
      urlPattern: 'asda_gb',
    },
    {
      number: '922',
      title: '0922 Brocacef NL',
      urlPattern: 'brocacef_voict',
    },
    {
      number: '356',
      title: '0356 BRT IT ',
      urlPattern: 'brt_api',
    },
    {
      number: '814',
      title: '0814 Colis PriveFR ',
      urlPattern: 'colis_prive_reverse',
    },
    {
      number: '953',
      title: '0953 Colis PriveBE',
      urlPattern: 'colis_prive_shop',
    },
    {
      number: '396',
      title: '0396 Correos ES',
      urlPattern: 'correos_int',
    },
    {
      number: '979',
      title: '0979 Czech Post API CZ',
      urlPattern: 'cz_post_api',
    },
    {
      number: '10',
      title: '0010 Danske Fragtmænd DK ',
      urlPattern: 'danske_fragtmaend',
    },
    {
      number: '983',
      title: '0983 CTT Iberia ES',
      urlPattern: 'dhl_iberia',
    },
    {
      number: '862',
      title: '0862 MyDHL Express INT ',
      urlPattern: 'dhl_mydhl_express',
    },
    {
      number: '761',
      title: '0761 DHL Parcel ES',
      urlPattern: 'dhl_parcel_spain',
    },
    {
      number: '937',
      title: '0937 DX GB',
      urlPattern: 'dx_freight',
    },
    {
      number: '923',
      title: '0923 Fast Despatch Logistics INT',
      urlPattern: 'fast_despatch_int',
    },
    {
      number: '371',
      title: '0371 Fedex Cross Border UK',
      urlPattern: 'fedex_cross_border_int',
    },
    {
      number: '968',
      title: '0968 GLS Austria ShipIt AT',
      urlPattern: 'gls_at',
    },
    {
      number: '960',
      title: '0960 GLS Spain ES',
      urlPattern: 'gls_es',
    },
    {
      number: '716',
      title: '716 GLS Czech Republic CZ',
      urlPattern: 'gls',
    },
    {
      number: '690',
      title: '0690 Hermes Germany DE ',
      urlPattern: 'hermes_de',
    },
    {
      number: '411',
      title: '0411 InPost PL ',
      urlPattern: 'inpost_gb',
    },
    {
      number: '732',
      title: '0732 TNT IT',
      urlPattern: 'it_tnt',
    },
    {
      number: '826',
      title: '0826 Nimber AS NO',
      urlPattern: 'nimber_no',
    },
    {
      number: '183',
      title: '0183 Post Netherlands NL',
      urlPattern: 'nl_post',
    },
    {
      number: '825',
      title: '0825 POST NL API NL',
      urlPattern: 'nl_post_api',
    },
    {
      number: '948',
      title: '0948 Posti API FI',
      urlPattern: 'posti_fi_api',
    },
    {
      number: '827',
      title: '0827 Schenker Poland PL',
      urlPattern: 'schenker_pl',
    },
    {
      number: '845',
      title: '0845 Post Slovenia SI',
      urlPattern: 'slovenia_post',
    },
    {
      number: '635',
      title: '0635 Taxydromiki GR',
      urlPattern: 'taxydromoki',
    },
    {
      number: '956',
      title: '0956 Postnord API',
      urlPattern: 'postnord/postnord_int/',
    },
    {
      number: '950',
      title: '0950 UPS Rest API INT',
      urlPattern: 'ups_api',
    },
    {
      number: '851',
      title: '0851 UPS TR',
      urlPattern: 'ups_turkey',
    },
    {
      number: '836',
      title: '0836 Access Worldwide US',
      urlPattern: 'us_access_worldwide',
    },
    {
      number: '986',
      title: '0986 Yurtigi Kargo TR',
      urlPattern: 'yurtici_kargo',
    },
    {
      number: '41',
      title: '0041 Geodis Wilson DK',
      urlPattern: 'geodis',
    },

    {
      number: '427',
      title: '0427 GLS BE ',
      urlPattern: 'gls_be',
    },
    {
      number: '257',
      title: '0257 GLS DE',
      urlPattern: 'gls_de',
    },
    {
      number: '11',
      title: '0011 GLS DK',
      urlPattern: 'gls_dk',
    },
    {
      number: '245',
      title: '0245 GLS FI',
      urlPattern: 'gls_fi',
    },
    {
      number: '386',
      title: '0386 GLS FR',
      urlPattern: 'gls_fr',
    },
    {
      number: '991',
      title: '0991 GLS Group API INT',
      urlPattern: 'gls_group',
    },
    {
      number: '832',
      title: '0832 GLS HR',
      urlPattern: 'gls_hr',
    },
    {
      number: '760',
      title: '0760 GLS IT',
      urlPattern: 'gls_it',
    },
    {
      number: '460',
      title: '0460 GLS NL ',
      urlPattern: 'gls_nl',
    },
    {
      number: '327',
      title: '0327 GLS PL',
      urlPattern: 'gls_pl',
    },
    {
      number: '821',
      title: '0821 GLS PT',
      urlPattern: 'gls_pt',
    },
    {
      number: '702',
      title: '0702 Go Express & Logistics DE',
      urlPattern: 'go_express_logistics',
    },
    {
      number: '410',
      title: '0410 HeltHjem NO ',
      urlPattern: 'helthjem',
    },
    {
      number: '424',
      title: '0424 Hermes UK ',
      urlPattern: 'hermes_uk',
    },
    {
      number: '908',
      title: '0908 Homerr NL ',
      urlPattern: 'homerr_nl',
    },
    {
      number: '947',
      title: '0947 Horoz TR',
      urlPattern: 'horoz',
    },
    {
      number: '782',
      title: '0782 HRX INT',
      urlPattern: 'hrx',
    },
    {
      number: '981',
      title: '0981 ICA Paket SE',
      urlPattern: 'ica_paket',
    },
    {
      number: '411',
      title: '0411 InPost PL ',
      urlPattern: 'inpost',
    },
    {
      number: '930',
      title: '0930 InPostIT',
      urlPattern: 'inpost_it',
    },
    {
      number: '627',
      title: '0627 Instabox SE',
      urlPattern: 'instabox',
    },
    {
      number: '236',
      title: '0236 Interfjord DK ',
      urlPattern: 'interfjord',
    },
    {
      number: '853',
      title: '0853 Jas FBG PL',
      urlPattern: 'jas_fbg',
    },
    {
      number: '857',
      title: '0857 Jersey Post GB',
      urlPattern: 'jersey_post',
    },
    {
      number: '842',
      title: '0842 JT Express MY',
      urlPattern: 'jt_express',
    },
    {
      number: '132',
      title: '0132 Kaukokiito FI',
      urlPattern: 'kaukokiito',
    },
    {
      number: '795',
      title: '0795 De Koomen Logistiek NL',
      urlPattern: 'koomen_logistiek',
    },
    {
      number: '53',
      title: '0053 Leman DK',
      urlPattern: 'leman',
    },
    {
      number: '800',
      title: '0800 Linford Transport EE',
      urlPattern: 'linford_transport',
    },
    {
      number: '419',
      title: '0419 Magyar Posta HU',
      urlPattern: 'magyar_posta',
    },

    {
      number: '321',
      title: '321 SF Express CH',
      urlPattern: 'sf_express',
    },

    {
      number: '855',
      title: '0855 Menzies GB',
      urlPattern: 'menzies',
    },
    {
      number: '873',
      title: '0873 Mondial Relay FR',
      urlPattern: 'mondial_relay',
    },
    {
      number: '453',
      title: '0453 Mover DK',
      urlPattern: 'mover',
    },
    {
      number: '892',
      title: '0892 MRW ES',
      urlPattern: 'mrw',
    },
    {
      number: '893',
      title: '0893 Nacex ES',
      urlPattern: 'nacex_es',
    },
    {
      number: '672',
      title: '0672 NemLeveringDK',
      urlPattern: 'nemlevering',
    },
    {
      number: '515',
      title: '0515 Nova Poshta INT',
      urlPattern: 'nova_poshta',
    },
    {
      number: '976',
      title: ' 0976 nShift Standard API INT',
      urlPattern: 'nshift_standard_api',
    },
    {
      number: '963',
      title: '0963 Overseas Express HR',
      urlPattern: 'overseas_express_hr',
    },
    {
      number: '880',
      title: '0880 Paack INT',
      urlPattern: 'paack',
    },
    {
      number: '954',
      title: '0954 Packeta CZ',
      urlPattern: 'packeta',
    },
    {
      number: '897',
      title: '0897 Packs/HPD NL',
      urlPattern: 'packs_hpd',
    },
    {
      number: '962',
      title: '0962 Pactic INT',
      urlPattern: 'pactic',
    },
    {
      number: '390',
      title: '0390 Palletways UK',
      urlPattern: 'palletways',
    },
    {
      number: '810',
      title: '0810 Palletways INT',
      urlPattern: 'palletways_int',
    },
    {
      number: '750',
      title: '0750 Pallex UK',
      urlPattern: 'pallex',
    },
    {
      number: '697',
      title: '0697 Parcelink Logistics GB',
      urlPattern: 'parcelink_logistics',
    },
    {
      number: '55',
      title: '0055 Pilotene NO',
      urlPattern: 'pilot',
    },
    {
      number: '975',
      title: '0975 Pitney BowesINT',
      urlPattern: 'pitney_bowes',
    },
    {
      number: '681',
      title: '0681 Porterbuddy NO',
      urlPattern: 'porterbuddy',
    },
    {
      number: '246',
      title: '0246 Post AT ',
      urlPattern: 'post_at',
    },
    {
      number: '633',
      title: '0633 Poste Italiane IT',
      urlPattern: 'poste_italiane',
    },
    {
      number: '114',
      title: '0114 Posti FI',
      urlPattern: 'posti_fi',
    },
    {
      number: '5',
      title: '0005 PostNord Logistics Norge NO',
      urlPattern: 'postnord',
    },
    {
      number: '9',
      title: '0009 PostNord DK',
      urlPattern: 'postnord_dk',
    },
    {
      number: '715',
      title: '0715 PPLCZ',
      urlPattern: 'ppl',
    },
    {
      number: '852',
      title: '0852 Premo SE ',
      urlPattern: 'premo',
    },
    {
      number: '952',
      title: '0952 ProCarrier GB',
      urlPattern: 'pro_carrier_gb',
    },
    {
      number: '811',
      title: '0811 Purolator CA',
      urlPattern: 'purolator',
    },
    {
      number: '740',
      title: '0740 Raben PL',
      urlPattern: 'raben',
    },

    {
      number: '901',
      title: '0901 Relais Colis FR',
      urlPattern: 'relais_colis/relais_colis_outbound',
    },
    {
      number: '939',
      title: '0939 Reliable Logistics CA',
      urlPattern: 'reliable_logistics',
    },
    {
      number: '192',
      title: '0192 Tricolore DK',
      urlPattern: 'rico',
    },
    {
      number: '468',
      title: '0468 ROHLIG SUUS LOGISTICS PL',
      urlPattern: 'rohlig_suus',
    },
    {
      number: '447',
      title: '0447 RoyalMail UK',
      urlPattern: 'royal_mail',
    },
    {
      number: '774',
      title: '0774 Saia US',
      urlPattern: 'saia',
    },
    {
      number: '52',
      title: '0052 Scan Global INT',
      urlPattern: 'scan_global',
    },
    {
      number: '757',
      title: '0757 Scan Shipping DK',
      urlPattern: 'scan_shipping',
    },
    {
      number: '7',
      title: '0007 Schenker NO',
      urlPattern: 'schenker',
    },
    {
      number: '847',
      title: '0847 Schenker International INT',
      urlPattern: 'schenker_international',
    },
    {
      number: '870',
      title: '0870 Schibsted Distribusjon NO',
      urlPattern: 'schibsted_distribusjon',
    },
    {
      number: '932',
      title: '0932 Seabourne Logistics GB ',
      urlPattern: 'seabourne_logistics',
    },
    {
      number: '723',
      title: '0723 SecuredMail UK',
      urlPattern: 'secured_mail',
    },
    {
      number: '736',
      title: '0736 ShipmentServer INT',
      urlPattern: 'shipment_server',
    },
    {
      number: '926',
      title: '0926 Speedlink NL ',
      urlPattern: 'speedlink',
    },
    {
      number: '733',
      title: '0733 Spring INT ',
      urlPattern: 'spring',
    },
    {
      number: '277',
      title: '0277 USPS Int',
      urlPattern: 'sps',
    },
    {
      number: '248',
      title: '0248 SwissPost CH ',
      urlPattern: 'swiss_post',
    },
    {
      number: '748',
      title: '0748 Tipsa ES',
      urlPattern: 'tipsa',
    },
    {
      number: '111',
      title: '0111 TNT DK',
      urlPattern: 'tnt',
    },
    {
      number: '856',
      title: '0856 TNT Australia AU',
      urlPattern: 'tnt_au',
    },
    {
      number: '444',
      title: '0444 TPN UK ',
      urlPattern: 'tpn',
    },
    {
      number: '935',
      title: '0935 Trunkrs NL ',
      urlPattern: 'trunkrs',
    },
    {
      number: '921',
      title: '0921 Trust Forwarding NO',
      urlPattern: 'trust_forwarding',
    },
    {
      number: '388',
      title: '0388 UK Mail UK ',
      urlPattern: 'uk_mail/uk_mail_dhl_return',
    },
    {
      number: '871',
      title: '0871 Ukrposhta UA',
      urlPattern: 'ukrposhta',
    },
    {
      number: '60',
      title: '0060 UPS INT',
      urlPattern: 'ups',
    },
    {
      number: '653',
      title: '0653 Urb-it SE ',
      urlPattern: 'urb',
    },
    {
      number: '918',
      title: '0918 Urbify DE',
      urlPattern: 'urbify_de',
    },
    {
      number: '277',
      title: '0277 USPS Int',
      urlPattern: 'usps',
    },
    {
      number: '700',
      title: '0700 Van & Poika FI',
      urlPattern: 'vanpoika',
    },
    {
      number: '479',
      title: '0479 Venipak LT',
      urlPattern: 'venipak',
    },
    {
      number: '767',
      title: '0767 VPD BE',
      urlPattern: 'vpd',
    },
    {
      number: '894',
      title: '0894 Walkers Transport GB',
      urlPattern: 'walkers_transport_gb',
    },
    {
      number: '701',
      title: '0701 W Cargo FI ',
      urlPattern: 'wcargo',
    },
    {
      number: '485',
      title: '0485 Whistl UK ',
      urlPattern: 'whistl',
    },
    {
      number: '839',
      title: '0839 Wideroe NO ',
      urlPattern: 'wideroe',
    },
    {
      number: '924',
      title: '0924 Wolt INT ',
      urlPattern: 'wolt_int',
    },
    {
      number: '357',
      title: '0357 YOYO GLOBAL FREIGHT DK',
      urlPattern: 'yoyo',
    },
    {
      number: '944',
      title: '0944 YunExpress INT ',
      urlPattern: 'yun_express',
    },
  ];

  searchTerm = '';
  currentPage = 1;
  itemsPerPage = 10;
  filteredCarriers = [...this.carrierspyt];

  constructor(private http: HttpClient, private wizardBackendService: WizardbackendService) {}

  ngOnInit(): void {
    // Preprocess the carriers
    this.carrierspyt = this.carrierspyt.map(carrier => ({
      ...carrier,
      title: carrier.title.replace(/^\d+\s*/, ''), // Remove leading numbers
    }));
    this.filteredCarriers = [...this.carrierspyt]; // Initialize filtered carriers

    // Load response from localStorage for testing
    const storageKey = `carrier_analysis`;
    const storedResponse = localStorage.getItem(storageKey);

    /*if (storedResponse) {
      this.response = storedResponse;
      const responseBody = this.extractBody(storedResponse);

    const cleanedResponse = this.removeInvalidJSON(responseBody);
      this.tabsBool = true;
    const cleanedResponseJSON = JSON.parse(cleanedResponse);
    const list = this.getAllValues(cleanedResponseJSON);
     this.carrierServer = this.parseListToJSON(list)
    ;    console.log(this.carrierServer);


      this.showToast('Loaded previous response from localStorage.', 'success');
    }

  */
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
  }

  copyCarrierServerToClipboard(): void {
    const formattedJson = JSON.stringify(this.carrierServer, null, 2); // Pre-format as JSON
    navigator.clipboard.writeText(formattedJson).then(
      () => {
        this.showToast('Carrier Server data copied to clipboard!', 'success');
      },
      err => {
        console.error('Failed to copy text: ', err);
        this.showToast('Failed to copy Carrier Server data. Please try again.', 'error');
      },
    );
  }

  parseListToJSON(list: string[]): any {
    const result = {
      data: {
        ProdConceptID: '',
        Services: [],
        Addresses: [] as any[],
        References: [] as any[],
        Lines: [] as any[],
        DetailGroups: [] as any[],
      },
      options: {
        TimeLog: 0,
        UseShippingRules: 0,
        Visibility: 'extended',
      },
      configuration: {
        Configuration: {
          ShipperAccount: {
            Shipper: {
              Account: '',
            },
          },
        },
      },
    };

    list.forEach(item => {
      if (item.startsWith('References.KindID[')) {
        const kindID = item.match(/\[(\d+)\]/)?.[1];
        if (kindID) {
          result.data.References.push({
            Kind: parseInt(kindID, 10),
            Value: 'xxx',
          });
        }
      } else if (item.startsWith('Kind')) {
        const match = item.match(/Kind(\d+)\.(\w+)/);
        if (match) {
          const kind = match[1];
          const field = match[2];
          let address = result.data.Addresses.find((addr: any) => addr.Kind === kind);
          if (!address) {
            address = { Kind: kind };
            result.data.Addresses.push(address);
          }
          address[field] = 'xxx'; // Placeholder value
        }
      } else if (item.startsWith('DetailGroups.GroupID')) {
        const match = item.match(/GroupID(\d+)\.KindID\[(\d+)\]/);
        if (match) {
          const groupID = parseInt(match[1], 10);
          const kindID = parseInt(match[2], 10);
          let group = result.data.DetailGroups.find((grp: any) => grp.GroupID === groupID);
          if (!group) {
            group = {
              GroupID: groupID,
              GroupDisplayName: `Group ${groupID}`,
              Details: [],
            };
            result.data.DetailGroups.push(group);
          }
          group.Details.push({
            KindID: kindID,
            Value: 'xxx',
          });
        }
      } else if (item.startsWith('Lines.')) {
        const field = item.split('.')[1];
        if (!result.data.Lines[0]) {
          result.data.Lines[0] = {}; // Ensure the first line exists
        }
        result.data.Lines[0][field] = 'xxx';
      } else if (item === 'ProdConceptID') {
        result.data.ProdConceptID = 'xxx';
      } else if (item === 'ShipperAccount.Shipper.Account') {
        result.configuration.Configuration.ShipperAccount.Shipper.Account = 'xxx';
      }
    });

    return result;
  }

  extractBody(jsonString) {
    let body = '"body":'; // Key to locate the Body section

    const bodyKey = '"body":'; // Key to locate the Body section
    const BodyKey = '"Body":'; // Key to locate the Body section
    const BODYKey = '"BODY":'; // Key to locate the Body section

    const bodyStart = jsonString.indexOf(bodyKey);
    const BodyStart = jsonString.indexOf(BodyKey);
    const BODYStart = jsonString.indexOf(BODYKey);

    if (bodyStart > -1) {
      body = bodyStart;
    }
    if (BodyStart > -1) {
      body = BodyStart;
    }
    if (BODYStart > -1) {
      body = BODYStart;
    }

    // Find the start of the actual object after "Body":
    const objectStart = jsonString.indexOf('{', body);
    const closingBraceIndex = jsonString.lastIndexOf('}');
    if (objectStart === -1 || closingBraceIndex === -1) {
      return null;
    } // Return null if braces are missing

    // Extract and return the content within the braces
    return jsonString.slice(objectStart, closingBraceIndex); // Include the opening brace, exclude the last }
  }

  private getAllValues(jsonObject: any): any[] {
    const values: any[] = [];

    function extractValues(obj: any): void {
      if (Array.isArray(obj)) {
        // Handle arrays
        obj.forEach(item => extractValues(item));
      } else if (typeof obj === 'object' && obj !== null) {
        // Handle objects
        Object.values(obj).forEach(value => extractValues(value));
      } else if (
        typeof obj !== 'number' && // Exclude integers
        obj !== '' && // Exclude empty strings
        typeof obj === 'string' && // Ensure it's a string
        (obj.includes('.') || obj === 'ProdConceptID') // Include strings with periods or 'ProdConceptID'
      ) {
        // Remove unwanted patterns like '{{' and '}}'
        const cleanedValue = obj.replace(/{{|}}/g, '').trim();
        values.push(cleanedValue);
      }
    }

    extractValues(jsonObject);

    // Remove duplicates by converting to a Set and back to an array
    return Array.from(new Set(values));
  }

  private removeInvalidJSON(jsonString: string): string {
    // Remove all single-line comments
    const singleLineCommentRegex = /\/\/.*$/gm;
    jsonString = jsonString.replace(singleLineCommentRegex, '');

    // Remove all multi-line comments
    const multiLineCommentRegex = /\/\*[\s\S]*?\*\//g;
    jsonString = jsonString.replace(multiLineCommentRegex, '');

    // Trim and return the sanitized string
    return jsonString.trim();
  }

  filterCarriers(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredCarriers = this.carrierspyt.filter(
      carrier => carrier.title.toLowerCase().includes(term) || carrier.number.includes(term),
    );
  }

  showToast(message: string, type: string) {
    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible = true;
    setTimeout(() => this.hideToast(), 8000);
  }

  hideToast() {
    this.toastVisible = false;
  }
  // Getter for filtered and paginated data

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(
      () => {
        this.showToast('Response copied to clipboard!', 'success');
      },
      err => {
        console.error('Failed to copy text: ', err);
        this.showToast('Failed to copy response. Please try again.', 'error');
      },
    );
  }

  selectCarrier(carrier: any): void {
    this.selectedCarrier = carrier;
    console.log(`Selected Carrier: ${carrier.title} (${carrier.number})`);
  }

  analyzeCarrier(carrier: any): void {
    this.tabsBool = false;
    this.activeCarrier = carrier; // Set the active carrier
    this.showToast(`Starting analysis for carrier: ${carrier.title}`, 'success');
    this.analyzedCarrier = `${carrier.title} (${carrier.number})`;

    // Reset the search and dropdown
    this.searchTerm = '';
    this.filteredCarriers = [];

    this.response = null;
    this.error = null;
    this.isLoading = true;

    const params = {
      id: carrier.number,
      model: this.selectedModel, // Include the selected model
    };

    // Använd WizardbackendService för att analysera carrier
    this.wizardBackendService.analyzeCarrier(params).subscribe({
      next: (res: string) => {
        this.response = res;
        this.isLoading = false;
        const storageKey = `carrier_analysis`;
        localStorage.setItem(storageKey, res);
        this.tabsBool = true;

        const responseBody = this.extractBody(res);
        const cleanedResponse = this.removeInvalidJSON(responseBody);

        const cleanedResponseJSON = JSON.parse(cleanedResponse);
        const list = this.getAllValues(cleanedResponseJSON);
        this.carrierServer = this.parseListToJSON(list);

        // Show success toast
        this.showToast(`Analysis completed for carrier: ${carrier.title}`, 'success');
      },
      error: err => {
        console.error('Error:', err);
        this.error = err.error || 'Failed to analyze files. Please try again.';
        this.showToast(`Error: ${this.error}`, 'error');
        this.isLoading = false;
        this.tabsBool = true;
      },
    });
  }
}
