import numpy as np
import mjspylab,math,json,codecs,datetime,qt,sys,time
devices = {'keithley3': qt.instruments.get('keithley3'),
           'keithley4': qt.instruments.get('keithley4'),
           'ivvi': qt.instruments.get('ivvi'),
}
data_folder = 'D:\\microkelvin\\Run2\\data\\'
description = """Getting a new calibration for the chip CuOx, back RuOx, and the CMN, and LCMN.
The LCMN here is new on the bridge.
Ch 2 MC S0005
Ch 4 LMMN <-- new!
Ch 5 RuOx Back
Ch 6 CMN
Ch 7 RuOx Chip
"""
attributes = {'sample': 'Cu Cu Ge varnish sample 2', # the sample number
         'title'      :'Thermal Conductivity', #a title for this data set
         'subtitle'   :'', # extra bit of infomation
         'series'     :'Thermaliser development', # a series of measurements as part of a group.
         'tags'       :['Temperature Sweep','Power Sweep','Thermaliser'], #keywords for searching for files later , gate_sweep iv_sweep
         'author'     :'MJS',
         'copyright'  : 'internal - not for public release',
         'fridge'     : 'Big Frossati', # What fridge it is being measured in
         'description': description,
         'fabricator' : 'MJS', # people who made it
         'operator'   : 'MJS', # people measuring it
        }
attributes['ivvi rack'] = {'Dac2 voltage output gain V/V': 100e-3,
                           'Dac2 current input gain V/A': 1e6,
                           'Dac1 current output gain A/V': 1e-3,
                           'Vmeas input gain V/V': 100}
coordinates=[
            {'name':'IVVI Dac1 / mV','range':np.linspace(0,2000,60)},
             ]
def setupFunction():
    devices['ivvi'].set_dacs_zero()
    time.sleep(1)
    return {}
def acqFunction(coordinates,results,prev_coordinates,prev_result,user_storage):
    'change the coordinates'
    results['Datetime Start'] = datetime.datetime.utcnow().isoformat()+'Z'
    devices['ivvi'].set_dac1(coordinates['IVVI Dac1 / mV'])
    results['MC Heater Current / A'] =  coordinates['IVVI Dac1 / mV'] / 1000 * attributes['ivvi rack']['Dac1 current output gain A/V']
    results['MC Heater Power / W (R=100)'] =  results['MC Heater Current / A']**2 / 100
    time.sleep(60*3*2)
    results['Datetime Measure'] = datetime.datetime.utcnow().isoformat()+'Z'
    results['Thermometary'] = mjspylab.readAuxrillaryLine('C:\\avs-47\\LogAVS___2017-07-27-10-48-48_6.dat')  
    results['Datetime End'] = datetime.datetime.utcnow().isoformat()+'Z'
    return True # keep going or stop early.
def resetFunction(measurement):
    devices['ivvi'].set_dacs_zero()
    return {}
result = mjspylab.aquireData(devices=devices,
                  coordinates=coordinates,
                  acqFunction=acqFunction, # inside the main loop
                  resetFunction=resetFunction,
                  setupFunction=setupFunction,
                  data_folder = data_folder,
                  save_backwards_compatable_files = True,
                  save_self_script = False,
                  show_live_plot = True,
                  attributes=attributes # the attributes and metadata.
                )