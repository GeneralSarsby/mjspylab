"""                        Generic data acquisition code.
                               ===  USER CODE  ===
      Author: MJS             Date: 2017-04-13                 Version: 0_0_4

This is written on top of the qtlab code and could not be done without it.
Much of the hard work has already been done, this just provides a nice
interface.
"""
import numpy as np
import mjspylab
reload(mjspylab) #testing only
import math,json,codecs,datetime,qt,sys,time
#make a dictionary of all the devices used.
devices = {'lockin1': qt.instruments.get('lockin1')
           #'keithley1': qt.instruments.get('keithley1'),
           #'keithley2': qt.instruments.get('keithley2'),
           #'keithley3': qt.instruments.get('keithley3'),
           #'magnet': qt.instruments.get('magnet'),
           #'Zmagnet' :  qt.instruments.get('Zmagnet')
           #'ivvi': qt.instruments.get('ivvi')
}
data_folder = 'D:\\microkelvin\\test\\data\\'
description = """Measuring the Big Frossati line filters using a lock in amplifier.
With a 50Ohm terminator on lockin input A.
"""
attributes = {'sample': 'DY105', # the sample number
        'title':'IV curve of thing', #a title for this data set
        'subtitle':'', # extra bit of infomation
        'series':'CBT development', # a series of measurements as part of a group.
        'tags':['iv','gate_sweep'], #keywords for searching for files later , gate_sweep iv_sweep
        'author':'',
        'copyright' : 'unknown',
        'fridge':'Big Frossati', # What fridge it is being measured in
        'description':description,
        'fabricator':'n/a', # people who made it
        'operator' : 'MJS', # people measuring it
        # save other data that is relivant for you!
        # connection lines? orientation? 
        
        }
# save the state of the ivvi rack. unfotunatally this is all done by hand.
attributes['ivvi rack'] = {}
coordinates=[
            {'name':'Repeats','range':[1,2,3]},
            {'name':'Frequency / Hz','range':np.linspace(1000,10000,300)},
             ]
def setupFunction():
    #devices['ivvi'].set_dacs_zero()
    #devices['magnet'].set_field(0)
    #devices['lockin1'].set_amplitude(0)
    return {}

def acqFunction(coordinates,results,prev_coordinates,prev_result,user_storage):
    'change the coordinates'
    if prev_result is not None:
        #do something using the prev result, maybe this is an optimisation?
        # this is the dictionary returned from the last loop itteration
        pass
    #devices['ivvi'].set_dac2(coordinates['IVVI Dac2 / mV'])
    devices['lockin1'].set_frequency(coordinates['Frequency / Hz'])
    
    
    #output_current = coordinates[0]*1e-3/1e6
    #results['Output Current / Amps'] = devices['ivvi'].get_dac2()*1e-3/1e6
    
    #if prev_coordinates['Zmagnet / T'] != coordinates['Zmagnet / T']:
        #devices['Zmagnet'].set_field(coordinates[0])
        #time.sleep(5)
    time.sleep(3)
    #k1 = devices['kiethley1'].get_readnextval()
    #l1_f = devices['lockin1'].get_frequency()
    #l1_X = devices['lockin1'].get_X()
    #l1_Y = devices['lockin1'].get_Y()
    #l1_R = devices['lockin1'].get_R()
    #l1_P = devices['lockin1'].get_P()
    #r['Current'] =  devices['kiethley1'].get_readnextval()
    #r['Voltage'] =  devices['kiethley2'].get_readnextval()
    results['Vx / Volts'] = devices['lockin1'].get_X()
    results['Vy / Volts'] = devices['lockin1'].get_Y()
    results['V mag / Volts'] = devices['lockin1'].get_R()
    results['Phase '] = devices['lockin1'].get_P()
    #results['Output Amplitude '] = devices['lockin1'].get_P()
    results['Datetime'] = datetime.datetime.utcnow().isoformat()+'Z'
    
    return True # keep going or stop early.

# the reset function is called last to reset everything back to a good state.
def resetFunction():
    #devices['ivvi'].set_dacs_zero()
    #devices['magnet'].set_field(0)
    #devices['lockin1'].set_amplitude(0)
    return {}

#you are done setting up
# below is faff.

#returns a dictionary that is the same as the saved JSON
result = mjspylab.aquireData(devices=devices,
                  coordinates=coordinates,
                  acqFunction=acqFunction, # inside the main loop
                  resetFunction=resetFunction,
                  setupFunction=setupFunction,
                  data_folder = data_folder,
                  save_backwards_compatable_files = False,
                  save_self_script = False,
                  show_live_plot = True,
                  attributes=attributes # the attributes and metadata.
                )