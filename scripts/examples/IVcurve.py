import numpy as np
import mjspylab,math,json,codecs,datetime,qt,sys,time
#make a dictionary of all the devices used.
devices = {'keithley1': qt.instruments.get('keithley1'),
           'keithley2': qt.instruments.get('keithley2'),
           'ivvi': qt.instruments.get('ivvi')
}
data_folder = 'D:\\test\\data\\' #this needs to exist.
description = """  """ # how
attributes = {'sample': '', # the sample number
        'title':'', # a title for this data set, what
        'subtitle':'', # extra bit of infomation, why
        'series':'', # a series of measurements as part of a group. context
        'tags':['IV sweep'], #keywords for searching for files later , gate_sweep iv_sweep
        'author':'',
        'copyright' : 'unknown',
        'fridge':'', # What fridge it is being measured in
        'description':description,
        'fabricator':'', # people who made it
        'operator' : '', # people measuring it
        # save other data that is relivant for you!
        # connection lines? orientation? 
        }
# save the state of the ivvi rack. unfotunatally you have to enter this all by hand.
attributes['ivvi rack'] = {'Dac 1 output voltage gain V/V' : 1e-3,
                    'Voltage input gain V/V', 100,
                    'Current input gain V/A':1e6}

coordinates=[
            {'name':'Repeats','range':[1,2,3]},
            {'name':'Dac 1 / mV','range':np.linspace(-1000,1000,300)},
             ]
def setupFunction():
    devices['ivvi'].set_dacs_zero()
    return {}

def acqFunction(coordinates,results,prev_coordinates,prev_result,user_storage):
    devices['ivvi'].set_dac1(coordinates['Dac 1 / mV'])
    time.sleep(1) # seconds
    results['Measured Dac 1 / mV'] = devices['ivvi'].get_dac1()
    results['Datetime'] = datetime.datetime.utcnow().isoformat()+'Z'
    k1 = devices['keithley1'].get_readnextval()
    k2 = devices['keithley2'].get_readnextval()
    results['keithley1'] = k1
    results['keithley2'] = k2
    # some on-the-fly analysis
    results['Current / A'] =  k1 / attributes['ivvi rack']['Current input gain V/A']
    results['Voltage / V'] =  k2 / attributes['ivvi rack']['Voltage input gain V/V']
    #results['Resistance / Ohm'] = results['Voltage / V'] / results['Current / A']
    #if 'Resistance / Ohm' in prev_result:
        #results['Differential Resistance / Ohm'] = results['Resistance / Ohm'] - prev_result['Resistance / Ohm']
    return True 
def resetFunction():
    devices['ivvi'].set_dacs_zero()
    return {}

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
